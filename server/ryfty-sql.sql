CREATE TABLE "users"(
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar_url" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "role" VARCHAR(255) CHECK
        ("role" IN('')) NOT NULL,
        "date_joined" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "users" ADD PRIMARY KEY("id");
CREATE TABLE "experiences"(
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "destinations" JSON NOT NULL,
    "activities" JSON NOT NULL,
    "inclusions" JSON NOT NULL,
    "exclusions" JSON NOT NULL,
    "poster_image_url" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NULL,
    "status" VARCHAR(255) CHECK
        ("status" IN('')) NOT NULL,
        "meeting_point" JSON NOT NULL,
        "created_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "updated_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "experiences" ADD PRIMARY KEY("id");
CREATE TABLE "slots"(
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "booked" INTEGER NOT NULL,
    "price" DECIMAL(8, 2) NOT NULL,
    "date" DATE NOT NULL
);
ALTER TABLE
    "slots" ADD PRIMARY KEY("id");
CREATE TABLE "reservations"(
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "slot_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_price" DECIMAL(8, 2) NOT NULL,
    "amount_paid" DECIMAL(8, 2) NOT NULL,
    "payment_type" VARCHAR(255) CHECK
        ("payment_type" IN('')) NOT NULL,
        "status" BIGINT NOT NULL,
        "due_date" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "created_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "update_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "experience_id" UUID NOT NULL,
        "checked_in" BOOLEAN NOT NULL
);
ALTER TABLE
    "reservations" ADD PRIMARY KEY("id");
CREATE TABLE "reservation_txn"(
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "amount" DECIMAL(8, 2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "platform_fee" DECIMAL(8, 2) NOT NULL,
    "slot_id" UUID NOT NULL,
    "transaction_reference" TEXT NOT NULL,
    "status" VARCHAR(255) CHECK
        ("status" IN('')) NOT NULL,
        "paid_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "created_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "updated_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "reservation_txn" ADD PRIMARY KEY("id");
CREATE TABLE "reservation_refunds"(
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "requested_amount" DECIMAL(8, 2) NOT NULL,
    "approved_amount" DECIMAL(8, 2) NOT NULL,
    "service_fee" DECIMAL(8, 2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(255) CHECK
        ("status" IN('')) NOT NULL,
        "requested_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "processed_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "notes" TEXT NOT NULL
);
ALTER TABLE
    "reservation_refunds" ADD PRIMARY KEY("id");
CREATE TABLE "user_wallet"(
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "balance" DECIMAL(8, 2) NOT NULL,
    "created_at" TIMESTAMP(0) WITH
        TIME zone NOT NULL,
        "updated_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "user_wallet" ADD PRIMARY KEY("id");
CREATE TABLE "platform_wallet"(
    "id" UUID NOT NULL,
    "balance" DECIMAL(8, 2) NOT NULL,
    "created_at" TIMESTAMP(0) WITH
        TIME zone NOT NULL,
        "update_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "platform_wallet" ADD PRIMARY KEY("id");
CREATE TABLE "users_ledger"(
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "txn_type" VARCHAR(255) CHECK
        ("txn_type" IN('')) NOT NULL,
        "reservation_txn" UUID NULL,
        "refund_txn" UUID NULL,
        "transaction_ref" TEXT NOT NULL,
        "amount" DECIMAL(8, 2) NOT NULL,
        "balance_before" DECIMAL(8, 2) NOT NULL,
        "date_done" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "users_ledger" ADD PRIMARY KEY("id");
CREATE TABLE "settlement_txn"(
    "id" UUID NOT NULL,
    "user_id" UUID NULL,
    "request_amount" DECIMAL(8, 2) NOT NULL,
    "approved_amount" DECIMAL(8, 2) NOT NULL,
    "checkout_id" TEXT NOT NULL,
    "txn_id" TEXT NOT NULL,
    "service_fee" DECIMAL(8, 2) NOT NULL,
    "platform" BOOLEAN NULL
);
ALTER TABLE
    "settlement_txn" ADD PRIMARY KEY("id");
CREATE TABLE "payment_method"(
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "default_method" VARCHAR(255) CHECK
        ("default_method" IN('')) NOT NULL,
        "paybill" INTEGER NOT NULL,
        "till_number" BIGINT NOT NULL,
        "account_no" TEXT NOT NULL,
        "mpesa_number" TEXT NOT NULL,
        "bank_id" TEXT NOT NULL,
        "bank_account_number" INTEGER NOT NULL,
        "default" BOOLEAN NOT NULL
);
ALTER TABLE
    "payment_method" ADD PRIMARY KEY("id");
ALTER TABLE
    "reservation_refunds" ADD CONSTRAINT "reservation_refunds_reservation_id_foreign" FOREIGN KEY("reservation_id") REFERENCES "reservations"("id");
ALTER TABLE
    "reservations" ADD CONSTRAINT "reservations_slot_id_foreign" FOREIGN KEY("slot_id") REFERENCES "slots"("id");
ALTER TABLE
    "experiences" ADD CONSTRAINT "experiences_provider_id_foreign" FOREIGN KEY("provider_id") REFERENCES "users"("id");
ALTER TABLE
    "payment_method" ADD CONSTRAINT "payment_method_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "settlement_txn" ADD CONSTRAINT "settlement_txn_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "payment_method"("user_id");
ALTER TABLE
    "reservation_refunds" ADD CONSTRAINT "reservation_refunds_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "settlement_txn" ADD CONSTRAINT "settlement_txn_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "user_wallet" ADD CONSTRAINT "user_wallet_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "slots" ADD CONSTRAINT "slots_experience_id_foreign" FOREIGN KEY("experience_id") REFERENCES "experiences"("id");
ALTER TABLE
    "reservations" ADD CONSTRAINT "reservations_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "reservation_txn" ADD CONSTRAINT "reservation_txn_slot_id_foreign" FOREIGN KEY("slot_id") REFERENCES "slots"("id");
ALTER TABLE
    "reservation_txn" ADD CONSTRAINT "reservation_txn_experience_id_foreign" FOREIGN KEY("experience_id") REFERENCES "experiences"("id");
ALTER TABLE
    "reservation_txn" ADD CONSTRAINT "reservation_txn_reservation_id_foreign" FOREIGN KEY("reservation_id") REFERENCES "reservations"("id");