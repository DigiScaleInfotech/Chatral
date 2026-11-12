-- Approximate visitor location from the IP address (offline GeoLite data). Nullable: existing rows unchanged.
ALTER TABLE "Visitor" ADD COLUMN "country" TEXT;
ALTER TABLE "Visitor" ADD COLUMN "city" TEXT;
