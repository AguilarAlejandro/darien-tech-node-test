-- Rename tables
ALTER TABLE "lugares" RENAME TO "locations";
ALTER TABLE "espacios" RENAME TO "spaces";
ALTER TABLE "reservas" RENAME TO "bookings";

-- Rename columns in locations (was lugares)
ALTER TABLE "locations" RENAME COLUMN "nombre" TO "name";
ALTER TABLE "locations" RENAME COLUMN "latitud" TO "latitude";
ALTER TABLE "locations" RENAME COLUMN "longitud" TO "longitude";

-- Rename columns in spaces (was espacios)
ALTER TABLE "spaces" RENAME COLUMN "lugar_id" TO "location_id";
ALTER TABLE "spaces" RENAME COLUMN "nombre" TO "name";
ALTER TABLE "spaces" RENAME COLUMN "referencia" TO "reference";
ALTER TABLE "spaces" RENAME COLUMN "capacidad" TO "capacity";
ALTER TABLE "spaces" RENAME COLUMN "descripcion" TO "description";

-- Rename columns in bookings (was reservas)
ALTER TABLE "bookings" RENAME COLUMN "espacio_id" TO "space_id";
ALTER TABLE "bookings" RENAME COLUMN "lugar_id" TO "location_id";
ALTER TABLE "bookings" RENAME COLUMN "email_cliente" TO "client_email";
ALTER TABLE "bookings" RENAME COLUMN "fecha_de_reserva" TO "booking_date";
ALTER TABLE "bookings" RENAME COLUMN "hora_inicio" TO "start_time";
ALTER TABLE "bookings" RENAME COLUMN "hora_fin" TO "end_time";

-- Rename columns in office_hours
ALTER TABLE "office_hours" RENAME COLUMN "espacio_id" TO "space_id";
ALTER TABLE "office_hours" RENAME COLUMN "apertura" TO "open_time";
ALTER TABLE "office_hours" RENAME COLUMN "cierre" TO "close_time";
ALTER TABLE "office_hours" RENAME COLUMN "dias_laborales" TO "work_days";

-- Rename columns in alerts
ALTER TABLE "alerts" RENAME COLUMN "espacio_id" TO "space_id";

-- Rename columns in device_desired
ALTER TABLE "device_desired" RENAME COLUMN "espacio_id" TO "space_id";

-- Rename columns in device_reported
ALTER TABLE "device_reported" RENAME COLUMN "espacio_id" TO "space_id";

-- Rename columns in telemetry_aggregations
ALTER TABLE "telemetry_aggregations" RENAME COLUMN "espacio_id" TO "space_id";
