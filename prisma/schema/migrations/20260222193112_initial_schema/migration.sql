-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('CO2', 'OCCUPANCY_MAX', 'OCCUPANCY_UNEXPECTED');

-- CreateEnum
CREATE TYPE "ApiKeyRole" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "client_email" TEXT NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "meta_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "role" "ApiKeyRole" NOT NULL DEFAULT 'USER',
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_hours" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "work_days" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_desired" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "sampling_interval_sec" INTEGER NOT NULL DEFAULT 10,
    "co2_alert_threshold" INTEGER NOT NULL DEFAULT 1000,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_desired_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_reported" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "sampling_interval_sec" INTEGER,
    "co2_alert_threshold" INTEGER,
    "firmware_version" TEXT,
    "reported_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_reported_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_aggregations" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "temp_c_avg" DOUBLE PRECISION NOT NULL,
    "temp_c_min" DOUBLE PRECISION NOT NULL,
    "temp_c_max" DOUBLE PRECISION NOT NULL,
    "humidity_pct_avg" DOUBLE PRECISION NOT NULL,
    "humidity_pct_min" DOUBLE PRECISION NOT NULL,
    "humidity_pct_max" DOUBLE PRECISION NOT NULL,
    "co2_ppm_avg" INTEGER NOT NULL,
    "co2_ppm_min" INTEGER NOT NULL,
    "co2_ppm_max" INTEGER NOT NULL,
    "occupancy_avg" DOUBLE PRECISION NOT NULL,
    "occupancy_min" INTEGER NOT NULL,
    "occupancy_max" INTEGER NOT NULL,
    "power_w_avg" DOUBLE PRECISION NOT NULL,
    "power_w_min" DOUBLE PRECISION NOT NULL,
    "power_w_max" DOUBLE PRECISION NOT NULL,
    "sample_count" INTEGER NOT NULL,

    CONSTRAINT "telemetry_aggregations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spaces_location_id_idx" ON "spaces"("location_id");

-- CreateIndex
CREATE INDEX "bookings_space_id_start_time_end_time_idx" ON "bookings"("space_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "bookings_client_email_idx" ON "bookings"("client_email");

-- CreateIndex
CREATE INDEX "bookings_location_id_idx" ON "bookings"("location_id");

-- CreateIndex
CREATE INDEX "alerts_space_id_kind_resolved_at_idx" ON "alerts"("space_id", "kind", "resolved_at");

-- CreateIndex
CREATE INDEX "alerts_resolved_at_idx" ON "alerts"("resolved_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "office_hours_space_id_key" ON "office_hours"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_desired_space_id_key" ON "device_desired"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_reported_space_id_key" ON "device_reported"("space_id");

-- CreateIndex
CREATE INDEX "telemetry_aggregations_space_id_window_start_idx" ON "telemetry_aggregations"("space_id", "window_start");

-- CreateIndex
CREATE UNIQUE INDEX "telemetry_aggregations_space_id_window_start_key" ON "telemetry_aggregations"("space_id", "window_start");

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_hours" ADD CONSTRAINT "office_hours_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_desired" ADD CONSTRAINT "device_desired_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_reported" ADD CONSTRAINT "device_reported_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_aggregations" ADD CONSTRAINT "telemetry_aggregations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
