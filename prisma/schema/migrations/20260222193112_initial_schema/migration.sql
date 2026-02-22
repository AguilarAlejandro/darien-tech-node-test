-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('CO2', 'OCCUPANCY_MAX', 'OCCUPANCY_UNEXPECTED');

-- CreateEnum
CREATE TYPE "ApiKeyRole" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "espacio_id" TEXT NOT NULL,
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
CREATE TABLE "device_desired" (
    "id" TEXT NOT NULL,
    "espacio_id" TEXT NOT NULL,
    "sampling_interval_sec" INTEGER NOT NULL DEFAULT 10,
    "co2_alert_threshold" INTEGER NOT NULL DEFAULT 1000,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_desired_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_reported" (
    "id" TEXT NOT NULL,
    "espacio_id" TEXT NOT NULL,
    "sampling_interval_sec" INTEGER,
    "co2_alert_threshold" INTEGER,
    "firmware_version" TEXT,
    "reported_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_reported_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espacios" (
    "id" TEXT NOT NULL,
    "lugar_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "referencia" TEXT,
    "capacidad" INTEGER NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "espacios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lugares" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lugares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_hours" (
    "id" TEXT NOT NULL,
    "espacio_id" TEXT NOT NULL,
    "apertura" TEXT NOT NULL,
    "cierre" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "dias_laborales" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "espacio_id" TEXT NOT NULL,
    "lugar_id" TEXT NOT NULL,
    "email_cliente" TEXT NOT NULL,
    "fecha_de_reserva" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TIMESTAMP(3) NOT NULL,
    "hora_fin" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_aggregations" (
    "id" TEXT NOT NULL,
    "espacio_id" TEXT NOT NULL,
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
CREATE INDEX "alerts_espacio_id_kind_resolved_at_idx" ON "alerts"("espacio_id", "kind", "resolved_at");

-- CreateIndex
CREATE INDEX "alerts_resolved_at_idx" ON "alerts"("resolved_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "device_desired_espacio_id_key" ON "device_desired"("espacio_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_reported_espacio_id_key" ON "device_reported"("espacio_id");

-- CreateIndex
CREATE INDEX "espacios_lugar_id_idx" ON "espacios"("lugar_id");

-- CreateIndex
CREATE UNIQUE INDEX "office_hours_espacio_id_key" ON "office_hours"("espacio_id");

-- CreateIndex
CREATE INDEX "reservas_espacio_id_hora_inicio_hora_fin_idx" ON "reservas"("espacio_id", "hora_inicio", "hora_fin");

-- CreateIndex
CREATE INDEX "reservas_email_cliente_idx" ON "reservas"("email_cliente");

-- CreateIndex
CREATE INDEX "reservas_lugar_id_idx" ON "reservas"("lugar_id");

-- CreateIndex
CREATE INDEX "telemetry_aggregations_espacio_id_window_start_idx" ON "telemetry_aggregations"("espacio_id", "window_start");

-- CreateIndex
CREATE UNIQUE INDEX "telemetry_aggregations_espacio_id_window_start_key" ON "telemetry_aggregations"("espacio_id", "window_start");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "espacios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_desired" ADD CONSTRAINT "device_desired_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "espacios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_reported" ADD CONSTRAINT "device_reported_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "espacios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espacios" ADD CONSTRAINT "espacios_lugar_id_fkey" FOREIGN KEY ("lugar_id") REFERENCES "lugares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_hours" ADD CONSTRAINT "office_hours_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "espacios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "espacios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_lugar_id_fkey" FOREIGN KEY ("lugar_id") REFERENCES "lugares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_aggregations" ADD CONSTRAINT "telemetry_aggregations_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "espacios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
