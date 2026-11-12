-- Visitor IP and browser user agent, used by trigger conditions (Visitor ip / hostname / browser / platform). Nullable: existing rows unchanged.
ALTER TABLE "Visitor" ADD COLUMN "ip" TEXT;
ALTER TABLE "Visitor" ADD COLUMN "userAgent" TEXT;
