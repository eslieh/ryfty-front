import logging
from celery_app import celery
from models import db, Reservation, User, UsersLedger, Slot, ReservationTxn, UserWallet, Experience, PlatformWallet, SettlementTxn, ReservationRefund
from decimal import Decimal, InvalidOperation
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
from workers.email_worker import send_reservation_email_async
from sqlalchemy import func
from utils.tarrifs import get_b2c_business_charge, get_b2b_business_charge, get_original_b2b_amount, get_original_b2c_value

logger = logging.getLogger(__name__)

@celery.task(bind=True, name="workers.reservation_create", max_retries=3, default_retry_delay=30)
def logg_wallet(self, slot_id, user_id, quantity, amount_paid, status, transaction_ref, reservation_id=None):
    """
    Celery task to log a wallet transaction using the passed parameters.
    """
    try:
        with current_app.app_context():
            # Validate and sanitize inputs
            try:
                amount = Decimal(amount_paid)
            except (InvalidOperation, TypeError):
                raise ValueError(f"Invalid amount_paid: {amount_paid}")

            # Fetch slot and experience
            slot = db.session.get(Slot, slot_id)
            if not slot:
                raise ValueError(f"Slot not found: {slot_id}")

            experience = db.session.get(Experience, slot.experience_id)
            if not experience:
                raise ValueError(f"Experience not found for slot {slot_id}")

            # Pricing and payment type
            price = slot.price * quantity
            payment_type = "mpesa"  # Assuming payment is always via M-Pesa for this task

            platform_fee = amount * Decimal("0.05")

            
            if reservation_id:
                # If reservation ID is provided, just log the transaction
                reservation = db.session.get(Reservation, reservation_id)
                if not reservation:
                    raise ValueError(f"Reservation not found: {reservation_id}")
                reservation.amount_paid += amount
            else:
        
                # Create reservation
                reservation = Reservation(
                    slot_id=slot_id,
                    user_id=user_id,
                    quantity=quantity,
                    amount_paid=amount,
                    status="confirmed",
                    total_price=price,
                    payment_type=payment_type,
                    experience_id=slot.experience_id,
                )
                db.session.add(reservation)
                db.session.flush()  # get reservation.id before txn
                
                # update the slot availability
                if slot.capacity < quantity:
                    raise ValueError(f"Not enough available spots in slot {slot_id}")
                slot.booked += quantity

            # Log transaction
            reservation_txn = ReservationTxn(
                experience_id=slot.experience_id,
                reservation_id=reservation.id,
                amount=amount,
                payment_method="mpesa",
                platform_fee=platform_fee,
                slot_id=slot_id,
                transaction_reference=transaction_ref,
                status="success",
            )
            db.session.add(reservation_txn)

            # Provider wallet
            provider_wallet = (
                db.session.query(UserWallet)
                .filter_by(user_id=experience.provider_id)
                .with_for_update()
                .one_or_none()
            )
            if not provider_wallet:
                provider_wallet = UserWallet(user_id=experience.provider_id, balance=Decimal("0"))
                db.session.add(provider_wallet)
                db.session.flush()
            provider_wallet.balance += (amount - platform_fee)

            # Platform wallet
            platform_wallet = db.session.query(PlatformWallet).with_for_update().first()
            if not platform_wallet:
                platform_wallet = PlatformWallet(balance=Decimal("0"))
                db.session.add(platform_wallet)
                db.session.flush()
            platform_wallet.balance += platform_fee
            
            

            # Commit all changes once
            db.session.commit()
            
            cache = current_app.cache
            base_key = f"provider_reservations:{slot.experience_id}"
            try:
                cache.delete_pattern(f"{base_key}*")  # if using Redis with delete_pattern
            except Exception:
                pass
            
            send_reservation_email_async.delay(reservation.id)
            
            
            create_ledger.delay(
                user_id=experience.provider_id,
                txn_type="credit",
                reservation_txn=reservation_txn.id,
                transaction_ref=transaction_ref,
                amount=amount,
                service_fee=platform_fee
            )
            
            logger.info(
                f"Wallet transaction logged: txn_ref={transaction_ref}, "
                f"slot={slot_id}, reservation={reservation.id}, "
                f"user={user_id}, amount={amount}, fee={platform_fee}"
            )

    except (ValueError,) as e:
        # Business/validation error: don't retry
        db.session.rollback()
        logger.error(f"Validation error in reservation logging: {e}")
        raise
    except SQLAlchemyError as e:
        # DB-level issues, safe to retry
        db.session.rollback()
        logger.exception(f"Database error while logging wallet txn for slot {slot_id}")
        raise self.retry(exc=e)                                                                                                         
    except Exception as e:
        # Unexpected errors
        db.session.rollback()
        logger.exception(f"Unexpected error logging wallet txn for slot {slot_id}")
        raise self.retry(exc=e)


@celery.task(bind=True, name="workers.wallet_settlement", max_retries=3, default_retry_delay=30)
def wallet_settlement(self, user_id, amount, checkout_id, transaction_ref, service_fee=0):
    """
    Celery task to handle wallet settlements.
    """
    try:
        with current_app.app_context():
            # Validate and sanitize inputs
            try:
                amount = Decimal(amount)
                service_fee = Decimal(service_fee)
                total_amount = amount + service_fee
            except (InvalidOperation, TypeError):
                raise ValueError(f"Invalid amount or fee: amount={amount}, fee={service_fee}")

            user = db.session.get(User, user_id)
            if not user:
                raise ValueError(f"User not found: {user_id}")

            if user.role == "admin":
                platform_wallet = db.session.query(PlatformWallet).with_for_update().first()
                if not platform_wallet or platform_wallet.balance < total_amount:
                    raise ValueError("Insufficient platform balance")
                platform_wallet.balance -= total_amount
            else:
                user_wallet = db.session.query(UserWallet).filter_by(user_id=user_id).with_for_update().one_or_none()
                if not user_wallet or user_wallet.balance < total_amount:
                    raise ValueError(f"Insufficient wallet balance for user {user_id}")
                user_wallet.balance -= total_amount

            # Log transaction
            settlement_txn = SettlementTxn(
                user_id=user_id,
                amount=total_amount,
                checkout_id=checkout_id,
                txn_id=transaction_ref,
                status="completed",
                service_fee=service_fee,
                platform=(user.role == "admin")
            )
            db.session.add(settlement_txn)
            db.session.commit()

            create_ledger.delay(
                user_id=user_id,
                txn_type="debit",
                settlement_txn=settlement_txn.id,
                transaction_ref=transaction_ref,
                amount=total_amount,
                service_fee=service_fee
            )
            logger.info(
                f"Settlement transaction logged: txn_ref={transaction_ref}, "
                f"settlement={settlement_txn.id}, user={user_id}, "
                f"amount={total_amount}, fee={service_fee}"
            )

    except ValueError as e:
        # Business/validation error: don't retry
        db.session.rollback()
        logger.error(f"Validation error in wallet settlement: {e}")
        raise
    except SQLAlchemyError as e:
        # DB-level issues, safe to retry
        db.session.rollback()
        logger.exception("Database error while logging wallet settlement")
        raise self.retry(exc=e)
    except Exception as e:
        # Unexpected errors
        db.session.rollback()
        logger.exception("Unexpected error logging wallet txn for settlement")
        raise self.retry(exc=e)


@celery.task(bind=True, name="workers.refund_settlement", max_retries=3, default_retry_delay=30)
def refund_settlement(self, user_id, refund_id, transaction_ref, service_fee=0, amount=0):
    """
    Celery task to handle wallet settlements (refunds).
    Always logs a refund record, marking failed ones for auditability.
    """
    try:
        with current_app.app_context():
            # Validate and sanitize amount
            try:
                amount = Decimal(amount)
            except (InvalidOperation, TypeError):
                raise ValueError(f"Invalid amount: {amount}")

            refund = db.session.get(ReservationRefund, refund_id)
            if not refund:
                raise ValueError(f"Refund not found: {refund_id}")

            # Mark refund attempt
            refund.transaction_reference = transaction_ref

            reservation = db.session.get(Reservation, refund.reservation_id)
            if not reservation:
                raise ValueError(f"Reservation not found for refund: {refund.reservation_id}")

            slot = db.session.get(Slot, reservation.slot_id)
            if not slot:
                raise ValueError(f"Slot not found for reservation: {reservation.slot_id}")

            # Lock wallet
            user_wallet = (
                db.session.query(UserWallet)
                .filter_by(user_id=user_id)
                .with_for_update()
                .one_or_none()
            )

            if not user_wallet or user_wallet.balance < (amount + Decimal(service_fee)):
                # Mark refund as failed
                refund.status = "failed"
                refund.approved_amount = Decimal("0.00")

                db.session.add(refund)
                db.session.commit()

                # Also log ledger failed txn
                failed_entry = UsersLedger(
                    user_id=user_id,
                    txn_type="debit",
                    refund_txn=refund_id,
                    fee_type="mpesa",
                    transaction_ref=transaction_ref,
                    amount=amount + Decimal(service_fee),
                    applicable_fee=service_fee,
                    balance_before=user_wallet.balance if user_wallet else Decimal("0.00"),
                    description="Reservation refund (FAILED: insufficient balance)",
                    balance=user_wallet.balance if user_wallet else Decimal("0.00"),
                    status="failed"
                )
                db.session.add(failed_entry)
                db.session.commit()

                raise ValueError(f"Insufficient wallet balance for user {user_id}")

            # If wallet is good, continue refund
            refund.approved_amount = amount
            refund.status = "approved"
            # refund.processed_at = db
            reservation.revocked = True
            slot.booked -= reservation.quantity

            user_wallet.balance -= amount + Decimal(service_fee)

            db.session.commit()

            # Queue ledger creation
            create_ledger.delay(
                user_id=user_id,
                txn_type="debit",
                refund_txn=refund_id,
                transaction_ref=transaction_ref,
                amount=amount + Decimal(service_fee),
                service_fee=service_fee
            )

            logger.info(
                f"Refund transaction logged: txn_ref={transaction_ref}, "
                f"refund={refund_id}, user={user_id}, amount={amount}, fee={service_fee}"
            )

    except ValueError as e:
        # Business/validation error: don’t retry, already logged as failed
        db.session.rollback()
        logger.error(f"Refund validation error for {refund_id}: {e}")
        raise
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.exception(f"Database error while logging refund txn {refund_id}")
        raise self.retry(exc=e)
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Unexpected error logging refund txn {refund_id}")
        raise self.retry(exc=e)
    


@celery.task(bind=True, name="workers.create_ledger", max_retries=3, default_retry_delay=30)
def create_ledger(self, user_id, txn_type, reservation_txn=None, settlement_txn=None,
                  refund_txn=None, transaction_ref=None, amount=0, service_fee=0):
    """
    Celery task to handle wallet ledger entries.
    Always logs a ledger record (success or failed) for auditability.
    """
    try:
        with current_app.app_context():
            # Validate and sanitize amount
            try:
                amount = Decimal(amount)
            except (InvalidOperation, TypeError):
                raise ValueError(f"Invalid amount: {amount}")

            user = db.session.get(User, user_id)
            if not user:
                raise ValueError(f"User not found: {user_id}")

            last_ledger = (
                db.session.query(UsersLedger)
                .filter_by(user_id=user_id)
                .order_by(UsersLedger.date_done.desc())
                .first()
            )

            # Default details
            fee_type = "unknown"
            description = "Generic transaction"

            if reservation_txn:
                fee_type = "platform"
                description = "Reservation payment"
            elif settlement_txn:
                settlement = db.session.get(SettlementTxn, settlement_txn)
                if not settlement:
                    raise ValueError(f"Settlement transaction not found: {settlement_txn}")
                fee_type = "mpesa"
                description = "Wallet settlement"
            elif refund_txn:
                refund = db.session.get(ReservationRefund, refund_txn)
                if not refund:
                    raise ValueError(f"Refund transaction not found: {refund_txn}")
                fee_type = "mpesa"
                description = "Reservation refund"

            previous_balance = last_ledger.balance if last_ledger else Decimal("0.00")

            # Compute balance safely
            if txn_type == "credit":
                new_balance = previous_balance + amount
            elif txn_type == "debit":
                if previous_balance < amount:
                    # Log failed ledger instead of just raising
                    failed_entry = UsersLedger(
                        user_id=user_id,
                        txn_type=txn_type,
                        reservation_txn=reservation_txn,
                        settlement_txn=settlement_txn,
                        refund_txn=refund_txn,
                        fee_type=fee_type,
                        transaction_ref=transaction_ref,
                        amount=amount,
                        applicable_fee=service_fee,
                        balance_before=previous_balance,
                        description=f"{description} (FAILED: insufficient balance)",
                        balance=previous_balance,  # balance unchanged
                        status="failed"            # <-- add status field in UsersLedger model if not already
                    )
                    db.session.add(failed_entry)
                    db.session.commit()
                    raise ValueError("Insufficient wallet balance")
                new_balance = previous_balance - amount
            else:
                raise ValueError(f"Invalid txn_type: {txn_type}")

            # Normal success entry
            ledger_entry = UsersLedger(
                user_id=user_id,
                txn_type=txn_type,
                reservation_txn=reservation_txn,
                settlement_txn=settlement_txn,
                refund_txn=refund_txn,
                fee_type=fee_type,
                transaction_ref=transaction_ref,
                amount=amount,
                applicable_fee=service_fee,
                balance_before=previous_balance,
                description=description,
                balance=new_balance,
                status="success"  # new field recommended
            )
            db.session.add(ledger_entry)
            db.session.commit()

    except ValueError as e:
        # Business errors (already logged failed txn above)
        db.session.rollback()
        logger.error(f"Ledger business error for user {user_id}: {e}")
        # Do NOT retry business logic errors
        raise
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.exception(f"Database error in create_ledger for user {user_id}")
        raise self.retry(exc=e)
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Unexpected error in create_ledger for user {user_id}")
        raise self.retry(exc=e)
