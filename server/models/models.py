from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, JSON
from datetime import datetime
from sqlalchemy import CheckConstraint, Index, func
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
    avatar_url = db.Column(db.Text, nullable=True)
    bio = db.Column(db.Text, nullable=True)
    role = db.Column(db.String(255), nullable=False, index=True, default="customer")  # Index for role-based queries
    is_email_verified = db.Column(db.Boolean, default=False, nullable=True)
    is_phone_verified = db.Column(db.Boolean, default=False, nullable=True)
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
    reviews = db.relationship("Review", back_populates="user", cascade="all, delete-orphan")  # Changed from 'review' to 'reviews'
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class VerificationToken(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(128), nullable=False, unique=True)
    type = db.Column(db.String(10), nullable=False)  # "email" or "phone" or "reset"
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

    user = db.relationship("User", backref="verification_tokens")


class Experience(db.Model):
    __tablename__ = "experiences"

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    provider_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.Text, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    destinations = db.Column(JSON, nullable=True)
    activities = db.Column(JSON, nullable=False)
    inclusions = db.Column(JSON, nullable=False)
    exclusions = db.Column(JSON, nullable=False)
    
    # New: multiple images stored in JSON (array of URLs or objects)
    images = db.Column(JSON, nullable=True, default=list)  

    # Keep poster_image_url for cover/thumbnail
    poster_image_url = db.Column(db.Text, nullable=False)

    start_date = db.Column(db.Date, nullable=False, index=True)
    end_date = db.Column(db.Date, nullable=True, index=True)
    status = db.Column(db.String(255), nullable=False, index=True)
    meeting_point = db.Column(JSON, nullable=False)

    avg_rating = db.Column(db.Float, nullable=True, default=0.0)
    reviews_count = db.Column(db.Integer, nullable=True, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint(
            f"status IN ('{ExperienceStatus.DRAFT}', '{ExperienceStatus.PUBLISHED}', '{ExperienceStatus.CLOSED}')",
            name='check_experience_status'
        ),
        Index('idx_experiences_provider_status', 'provider_id', 'status'),
        Index('idx_experiences_status_dates', 'status', 'start_date', 'end_date'),
        Index('idx_experiences_date_range', 'start_date', 'end_date'),
        Index('idx_experiences_search', db.text("to_tsvector('english', title || ' ' || description)"), 
              postgresql_using='gin'),
        Index('idx_experiences_published', 'id', 'start_date', postgresql_where=db.text("status = 'published'")),
    )

    reviews = db.relationship("Review", back_populates="experience", lazy="dynamic")
    provider = db.relationship("User", back_populates="experiences")
    slots = db.relationship("Slot", back_populates="experience")
    reservations = db.relationship("Reservation", back_populates="experience")
    transactions = db.relationship("ReservationTxn", back_populates="experience")

    def update_review_stats(self):
        """Recalculate avg_rating and reviews_count from reviews table."""
        if self.reviews.count() > 0:
            self.reviews_count = self.reviews.count()
            self.avg_rating = round(
                db.session.query(func.avg(Review.rating))
                .filter(Review.experience_id == self.id)
                .scalar(),
                2
            )
        else:
            self.reviews_count = 0
            self.avg_rating = 0.0

    def __repr__(self):
        return f"<Experience {self.title} ({self.status})>"


class Slot(db.Model):
    __tablename__ = "slots"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    experience_id = db.Column(UUID(as_uuid=True), db.ForeignKey("experiences.id"), nullable=False, index=True)
    
    name = db.Column(db.Text, nullable=False, index=True)
    capacity = db.Column(db.Integer, nullable=False, index=True)
    booked = db.Column(db.Integer, nullable=False, default=0, index=True)
    price = db.Column(db.Numeric(8, 2), nullable=False, index=True)

    # Date and time
    date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.Time, nullable=False, index=True)  # With tz info
    end_time = db.Column(db.Time, nullable=False, index=True)

    # Store tz as string ("Africa/Nairobi", "UTC", etc.) for clarity
    timezone = db.Column(db.String(64), nullable=False, default="UTC+3")

    __table_args__ = (
        Index('idx_slots_experience_date', 'experience_id', 'date'),
        Index('idx_slots_date_availability', 'date', 'capacity', 'booked'),
        Index('idx_slots_price_date', 'price', 'date'),
        Index('idx_slots_time_range', 'date', 'start_time', 'end_time'),
        Index('idx_slots_available', 'experience_id', 'date',
              postgresql_where=db.text('capacity > booked')),
    )

    experience = db.relationship("Experience", back_populates="slots")
    reservations = db.relationship("Reservation", back_populates="slot")
    transactions = db.relationship("ReservationTxn", back_populates="slot")

    def __repr__(self):
        return f"<Slot {self.name} - {self.date} {self.start_time}-{self.end_time} {self.timezone}>"


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
    due_date = db.Column(db.DateTime(timezone=True), nullable=True, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    update_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    experience_id = db.Column(UUID(as_uuid=True), db.ForeignKey("experiences.id"), nullable=False, index=True)
    checked_in = db.Column(db.Boolean, nullable=False, default=False, index=True)
    revocked = db.Column(db.Boolean, nullable=True, default=False, index=True)
    checkin_time = db.Column(db.DateTime(timezone=True), nullable=True, index=True)
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
        Index('idx_reservations_id', 'id'),
        Index('idx_reservations_user_id', 'user_id'),
        Index('idx_reservations_experience_id', 'experience_id'),
        Index('idx_reservations_slot_id', 'slot_id'),
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
    reviews = db.relationship("Review", back_populates="reservation")  # Add this line

    def __repr__(self):
        return f"<Reservation {self.id} ({self.status})>"

class ApiCollection(db.Model):
    __tablename__ = "api_collections"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot_id = db.Column(UUID(as_uuid=True), db.ForeignKey("slots.id"), nullable=False, index=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)
    reservation_id = db.Column(UUID(as_uuid=True), db.ForeignKey("reservations.id"), nullable=True, index=True)
    experience_id = db.Column(UUID(as_uuid=True), db.ForeignKey("experiences.id"), nullable=False, index=True)
    amount = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    mpesa_checkout_request_id = db.Column(db.Text, nullable=True, unique=True, index=True)  # Unique index for checkout ID
    transaction_reference = db.Column(db.Text, nullable=True, unique=True, index=True)  # Unique index for reference
    status = db.Column(db.String(255), nullable=False, index=True)
    mpesa_number = db.Column(db.Text, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<ApiCollection {self.name}>"
    
class ApiDisbursement(db.Model):
    __tablename__ = "api_disbursements"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    amount = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    refund_id = db.Column(UUID(as_uuid=True), db.ForeignKey("reservation_refunds.id"), nullable=True, index=True)
    
    mpesa_checkout_request_id = db.Column(db.Text, nullable=True, unique=True, index=True)  # Unique index for checkout ID
    transaction_reference = db.Column(db.Text, nullable=True, unique=True, index=True)  # Unique index for reference
    status = db.Column(db.String(255), nullable=False, index=True)
    mpesa_number = db.Column(db.Text, nullable=True, index=True)
    disbursement_type = db.Column(db.String(255), nullable=False, index=True) # e.g., "payout", "refund", "settlement"
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<ApiDisbursement {self.name}>"

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
    paid_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
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
    requested_amount = db.Column(db.Numeric(10, 2), nullable=False, index=True)
    approved_amount = db.Column(db.Numeric(10, 2), nullable=True, index=True)
    transaction_reference = db.Column(db.Text, nullable=True, unique=True, index=True)  # Unique index for reference
    mpesa_number = db.Column(db.Text, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    reason = db.Column(db.Text, nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    admin_reason = db.Column(db.Text, nullable=True)
    requested_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
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
        Index('idx_refunds_pending', 'requested_amount', 'reservation_id',
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
    settlement_txn = db.Column(UUID(as_uuid=True), db.ForeignKey("settlement_txn.id"), nullable=True, index=True)
    refund_txn = db.Column(UUID(as_uuid=True), db.ForeignKey("reservation_refunds.id"), nullable=True, index=True)
    applicable_fee = db.Column(db.Numeric(8, 2), nullable=True) # e.g., platform fee on credits
    fee_type = db.Column(db.String(255), nullable=True, index=True) # e.g., "platform", "mpesa", etc.
    transaction_ref = db.Column(db.Text, nullable=False, index=True)
    amount = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    status = db.Column(db.Text, nullable=True)
    balance_before = db.Column(db.Numeric(8, 2), nullable=False)
    balance = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
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
    amount = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    checkout_id = db.Column(db.Text, nullable=False, unique=True, index=True)
    txn_id = db.Column(db.Text, nullable=False, unique=True, index=True)
    status = db.Column(db.Text, nullable=False)
    service_fee = db.Column(db.Numeric(8, 2), nullable=False, index=True)
    platform = db.Column(db.Boolean, nullable=True, index=True)
    date_done = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    __table_args__ = (
        # Composite indexes for settlement reporting
        Index('idx_settlement_user_amount', 'user_id', 'amount'),
        Index('idx_settlement_platform_amount', 'platform', 'amount'),
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
            "default_method IN ('mpesa', 'bank', 'paybill', 'till_number')",
            name='ck_payment_method_check_default_method'
        ),
    )

    user = db.relationship("User", back_populates="payment_methods")

    def __repr__(self):
        return f"<PaymentMethod {self.default_method} for {self.user_id}>"

class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relationships
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    experience_id = db.Column(UUID(as_uuid=True), db.ForeignKey("experiences.id"), nullable=False, index=True)
    reservation_id = db.Column(UUID(as_uuid=True), db.ForeignKey("reservations.id"), nullable=True, index=True)

    # Review details
    rating = db.Column(db.Integer, nullable=False, index=True)  # 1–5 stars
    comment = db.Column(db.Text, nullable=True)
    images = db.Column(JSON, nullable=True)  # optional list of review images

    # Metadata
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_review_rating"),
        Index('idx_reviews_experience_rating', 'experience_id', 'rating'),
        Index('idx_review_experience_created', 'experience_id', 'created_at'),
        Index('idx_reviews_user_experience', 'user_id', 'experience_id'),
    )

    user = db.relationship("User", back_populates="reviews")        # Changed to 'reviews'
    experience = db.relationship("Experience", back_populates="reviews")  # Changed to 'reviews'
    reservation = db.relationship("Reservation", back_populates="reviews") # Changed to 'reviews'


    def __repr__(self):
        return f"<Review {self.rating}★ by {self.user_id} on {self.experience_id}>"

    
# note

# CREATE EXTENSION IF NOT EXISTS pg_trgm; fpr fuzzy text search
# CREATE EXTENSION IF NOT EXISTS unaccent;   -- optional, but helps normalize
# CREATE INDEX IF NOT EXISTS experience_trgm_idx
# ON experiences
# USING gin (
#   (title || ' ' || description || ' ' || destinations::text || ' ' || activities::text) gin_trgm_ops
# )