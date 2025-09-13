from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, JSON
from datetime import datetime
from sqlalchemy import CheckConstraint, Index
from models import db
import uuid

# --- ENUM-LIKE CONSTANTS ---

class UserRole:
    ADMIN = "admin"
    PROVIDER = "provider"
    CUSTOMER = "customer"

class ExperienceStatus:
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"

class ReservationStatus:
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    

class PaymentType:
    CARD = "card"
    MPESA = "mpesa"
    BANK = "bank"
    WALLET = "wallet"

class TxnStatus:
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class LedgerTxnType:
    DEBIT = "debit"
    CREDIT = "credit"

class DefaultMethod:
    MPESA = "mpesa"
    BANK = "bank"
    PAYBILL = "paybill"
    TILL_NUMBER = "till_number"


# --- MODELS ---

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.Text, nullable=False, index=True)  # Index for name searches
    email = db.Column(db.Text, nullable=False, unique=True, index=True)  # Unique index for email
    phone = db.Column(db.Text, nullable=True, unique=True, index=True)  # Unique index for phone
    password = db.Column(db.Text, nullable=True)
    avator_url = db.Column(db.Text, nullable=True)
    bio = db.Column(db.Text, nullable=True)
    role = db.Column(db.String(255), nullable=False, index=True, default="customer")  # Index for role-based queries
    date_joined = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)  # Index for date queries

    # Define constraints and indexes in __table_args__
    __table_args__ = (
        CheckConstraint(
            f"role IN ('{UserRole.ADMIN}', '{UserRole.PROVIDER}', '{UserRole.CUSTOMER}')",
            name='check_user_role'
        ),
        # Composite index for common queries
        Index('idx_users_role_date', 'role', 'date_joined'),
        # Partial index for active providers
        Index('idx_users_active_providers', 'id', postgresql_where=db.text("role = 'provider'")),
    )

    experiences = db.relationship("Experience", back_populates="provider")
    reservations = db.relationship("Reservation", back_populates="user")
    wallet = db.relationship("UserWallet", uselist=False, back_populates="user")
    payment_methods = db.relationship("PaymentMethod", back_populates="user")
    ledger = db.relationship("UsersLedger", back_populates="user")
    refunds = db.relationship("ReservationRefund", back_populates="user")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class Experience(db.Model):
    __tablename__ = "experiences"

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    provider_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)  # Index for provider queries
    title = db.Column(db.Text, nullable=False, index=True)  # Index for title searches
    description = db.Column(db.Text, nullable=False)
    destinations = db.Column(JSON, nullable=False)
    activities = db.Column(JSON, nullable=False)
    inclusions = db.Column(JSON, nullable=False)
    exclusions = db.Column(JSON, nullable=False)
    poster_image_url = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.Date, nullable=False, index=True)  # Index for date range queries
    end_date = db.Column(db.Date, nullable=True, index=True)  # Index for date range queries
    status = db.Column(db.String(255), nullable=False, index=True)  # Index for status filtering
    meeting_point = db.Column(JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint(
            f"status IN ('{ExperienceStatus.DRAFT}', '{ExperienceStatus.PUBLISHED}', '{ExperienceStatus.CLOSED}')",
            name='check_experience_status'
        ),
        # Composite indexes for common query patterns
        Index('idx_experiences_provider_status', 'provider_id', 'status'),
        Index('idx_experiences_status_dates', 'status', 'start_date', 'end_date'),
        Index('idx_experiences_date_range', 'start_date', 'end_date'),
        # Full-text search index on title and description (PostgreSQL specific)
        Index('idx_experiences_search', db.text("to_tsvector('english', title || ' ' || description)"), 
              postgresql_using='gin'),
        # Partial index for published experiences
        Index('idx_experiences_published', 'id', 'start_date', postgresql_where=db.text("status = 'published'")),
    )

    provider = db.relationship("User", back_populates="experiences")
    slots = db.relationship("Slot", back_populates="experience")
    reservations = db.relationship("Reservation", back_populates="experience")
    transactions = db.relationship("ReservationTxn", back_populates="experience")

    def __repr__(self):
        return f"<Experience {self.title} ({self.status})>"


class Slot(db.Model):
    __tablename__ = "slots"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    experience_id = db.Column(UUID(as_uuid=True), db.ForeignKey("experiences.id"), nullable=False, index=True)
    name = db.Column(db.Text, nullable=False, index=True)
    capacity = db.Column(db.Integer, nullable=False, index=True)  # Index for capacity filtering
    booked = db.Column(db.Integer, nullable=False, default=0, index=True)  # Index for availability checks
    price = db.Column(db.Numeric(8, 2), nullable=False, index=True)  # Index for price sorting/filtering
    date = db.Column(db.Date, nullable=False, index=True)  # Index for date queries

    __table_args__ = (
        # Composite indexes for common queries
        Index('idx_slots_experience_date', 'experience_id', 'date'),
        Index('idx_slots_date_availability', 'date', 'capacity', 'booked'),
        Index('idx_slots_price_date', 'price', 'date'),
        # Partial index for available slots
        Index('idx_slots_available', 'experience_id', 'date', 
              postgresql_where=db.text('capacity > booked')),
    )

    experience = db.relationship("Experience", back_populates="slots")
    reservations = db.relationship("Reservation", back_populates="slot")
    transactions = db.relationship("ReservationTxn", back_populates="slot")

    def __repr__(self):
        return f"<Slot {self.name} - {self.date}>"


class Reservation(db.Model):
    __tablename__ = "reservations"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    slot_id = db.Column(UUID(as_uuid=True), db.ForeignKey("slots.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    amount_paid = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    payment_type = db.Column(db.String(255), nullable=False, index=True)
    status = db.Column(db.String(255), nullable=False, index=True)
    due_date = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    update_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    experience_id = db.Column(UUID(as_uuid=True), db.ForeignKey("experiences.id"), nullable=False, index=True)
    checked_in = db.Column(db.Boolean, nullable=False, default=False, index=True)

    __table_args__ = (
        CheckConstraint(
            f"payment_type IN ('{PaymentType.CARD}', '{PaymentType.MPESA}', '{PaymentType.BANK}', '{PaymentType.WALLET}')",
            name='check_payment_type'
        ),
        CheckConstraint(
            f"status IN ('{ReservationStatus.PENDING}', '{ReservationStatus.CONFIRMED}', '{ReservationStatus.CANCELLED}', '{ReservationStatus.COMPLETED}')",
            name='check_reservation_status'
        ),
        # Composite indexes for common query patterns
        Index('idx_reservations_user_status', 'user_id', 'status'),
        Index('idx_reservations_experience_status', 'experience_id', 'status'),
        Index('idx_reservations_slot_status', 'slot_id', 'status'),
        Index('idx_reservations_due_date_status', 'due_date', 'status'),
        Index('idx_reservations_created_status', 'created_at', 'status'),
        # Partial indexes for specific statuses
        Index('idx_reservations_pending', 'user_id', 'due_date', 
              postgresql_where=db.text("status = 'pending'")),
        Index('idx_reservations_confirmed', 'experience_id', 'created_at', 
              postgresql_where=db.text("status = 'confirmed'")),
        # Index for payment reconciliation
        Index('idx_reservations_payment', 'payment_type', 'total_price', 'amount_paid'),
    )

    user = db.relationship("User", back_populates="reservations")
    slot = db.relationship("Slot", back_populates="reservations")
    experience = db.relationship("Experience", back_populates="reservations")
    transactions = db.relationship("ReservationTxn", back_populates="reservation")
    refunds = db.relationship("ReservationRefund", back_populates="reservation")

    def __repr__(self):
        return f"<Reservation {self.id} ({self.status})>"


class ReservationTxn(db.Model):
    __tablename__ = "reservation_txn"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    experience_id = db.Column(UUID(as_uuid=True), db.ForeignKey("experiences.id"), nullable=False, index=True)
    reservation_id = db.Column(UUID(as_uuid=True), db.ForeignKey("reservations.id"), nullable=False, index=True)
    amount = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    payment_method = db.Column(db.Text, nullable=False, index=True)
    platform_fee = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    slot_id = db.Column(UUID(as_uuid=True), db.ForeignKey("slots.id"), nullable=False, index=True)
    transaction_reference = db.Column(db.Text, nullable=False, unique=True, index=True)  # Unique index for reference
    status = db.Column(db.String(255), nullable=False, index=True)
    paid_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint(
            f"status IN ('{TxnStatus.PENDING}', '{TxnStatus.SUCCESS}', '{TxnStatus.FAILED}')",
            name='check_txn_status'
        ),
        # Composite indexes for financial reporting and reconciliation
        Index('idx_reservation_txn_status_paid', 'status', 'paid_at'),
        Index('idx_reservation_txn_method_status', 'payment_method', 'status'),
        Index('idx_reservation_txn_experience_date', 'experience_id', 'paid_at'),
        Index('idx_reservation_txn_amount_date', 'amount', 'paid_at'),
        # Index for settlement calculations
        Index('idx_reservation_txn_settlement', 'status', 'platform_fee', 'paid_at'),
        # Partial index for successful transactions
        Index('idx_reservation_txn_success', 'experience_id', 'amount', 'paid_at',
              postgresql_where=db.text("status = 'success'")),
    )

    experience = db.relationship("Experience", back_populates="transactions")
    reservation = db.relationship("Reservation", back_populates="transactions")
    slot = db.relationship("Slot", back_populates="transactions")

    def __repr__(self):
        return f"<ReservationTxn {self.transaction_reference} ({self.status})>"


class ReservationRefund(db.Model):
    __tablename__ = "reservation_refunds"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reservation_id = db.Column(UUID(as_uuid=True), db.ForeignKey("reservations.id"), nullable=False, index=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    experience_id = db.Column(UUID(as_uuid=True), db.ForeignKey("experiences.id"), nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    reason = db.Column(db.Text, nullable=True)
    processed_at = db.Column(db.DateTime, nullable=True, index=True)

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="check_reservation_refund_status"
        ),
        # Composite indexes for refund management
        Index('idx_refunds_status_processed', 'status', 'processed_at'),
        Index('idx_refunds_user_status', 'user_id', 'status'),
        Index('idx_refunds_experience_status', 'experience_id', 'status'),
        # Partial index for pending refunds
        Index('idx_refunds_pending', 'amount', 'reservation_id',
              postgresql_where=db.text("status = 'pending'")),
    )

    reservation = db.relationship("Reservation", back_populates="refunds")
    user = db.relationship("User", back_populates="refunds")

    def __repr__(self):
        return f"<ReservationRefund id={self.id} status={self.status} amount={self.amount}>"


class UserWallet(db.Model):
    __tablename__ = "user_wallet"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    balance = db.Column(db.Numeric(8, 2), nullable=False, default=0.0, index=True)  # Index for balance queries
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        # Index for wallet balance reporting
        Index('idx_user_wallet_balance_updated', 'balance', 'updated_at'),
    )

    user = db.relationship("User", back_populates="wallet")

    def __repr__(self):
        return f"<UserWallet {self.user_id} balance={self.balance}>"


class PlatformWallet(db.Model):
    __tablename__ = "platform_wallet"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    balance = db.Column(db.Numeric(8, 2), nullable=False, default=0.0, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<PlatformWallet balance={self.balance}>"


class UsersLedger(db.Model):
    __tablename__ = "users_ledger"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    txn_type = db.Column(db.String(255), nullable=False, index=True)
    reservation_txn = db.Column(UUID(as_uuid=True), db.ForeignKey("reservation_txn.id"), nullable=True, index=True)
    refund_txn = db.Column(UUID(as_uuid=True), db.ForeignKey("reservation_refunds.id"), nullable=True, index=True)
    transaction_ref = db.Column(db.Text, nullable=False, index=True)
    amount = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    balance_before = db.Column(db.Numeric(8, 2), nullable=False)
    date_done = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint(
            f"txn_type IN ('{LedgerTxnType.DEBIT}', '{LedgerTxnType.CREDIT}')",
            name='check_ledger_txn_type'
        ),
        # Composite indexes for ledger queries
        Index('idx_users_ledger_user_date', 'user_id', 'date_done'),
        Index('idx_users_ledger_type_date', 'txn_type', 'date_done'),
        Index('idx_users_ledger_user_type_date', 'user_id', 'txn_type', 'date_done'),
        Index('idx_users_ledger_amount_date', 'amount', 'date_done'),
        # Index for transaction reference lookups
        Index('idx_users_ledger_ref', 'transaction_ref'),
    )

    user = db.relationship("User", back_populates="ledger")

    def __repr__(self):
        return f"<UsersLedger {self.txn_type} {self.amount}>"


class SettlementTxn(db.Model):
    __tablename__ = "settlement_txn"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=True, index=True)
    request_amount = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    approved_amount = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    checkout_id = db.Column(db.Text, nullable=False, unique=True, index=True)
    txn_id = db.Column(db.Text, nullable=False, unique=True, index=True)
    service_fee = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    platform = db.Column(db.Boolean, nullable=True, index=True)

    __table_args__ = (
        # Composite indexes for settlement reporting
        Index('idx_settlement_user_amount', 'user_id', 'approved_amount'),
        Index('idx_settlement_platform_amount', 'platform', 'approved_amount'),
    )

    def __repr__(self):
        return f"<SettlementTxn {self.txn_id}>"


class PaymentMethod(db.Model):
    __tablename__ = "payment_method"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    default_method = db.Column(db.String(255), nullable=False, index=True)
    paybill = db.Column(db.Integer, nullable=True)
    till_number = db.Column(db.Integer, nullable=True)
    account_no = db.Column(db.Text, nullable=True)
    mpesa_number = db.Column(db.Text, nullable=True, index=True)  # Index for MPESA lookups
    bank_id = db.Column(db.Text, nullable=True)
    bank_account_number = db.Column(db.Text, nullable=True)

    __table_args__ = (
        CheckConstraint(
            f"default_method IN ('{DefaultMethod.MPESA}', '{DefaultMethod.BANK}', '{DefaultMethod.PAYBILL}', '{DefaultMethod.TILL_NUMBER}')",
            name='check_default_method'
        ),
        # # Composite indexes for payment method queries
        # Index('idx_payment_method_user_type', 'user_id', 'default_method'),
        # # Partial index for default payment methods
        # Index('idx_payment_method_defaults', 'user_id', 'default_method',
        #       postgresql_where=db.text('default = true')),
    )

    user = db.relationship("User", back_populates="payment_methods")

    def __repr__(self):
        return f"<PaymentMethod {self.default_method} for {self.user_id}>"