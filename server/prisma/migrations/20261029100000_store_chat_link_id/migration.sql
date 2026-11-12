-- Per-store 8-digit id for the direct "open chat" link, e.g. https://yourshop.com/#lc-01234567.
-- Nullable first so existing rows can be backfilled with a unique value before the constraint is added.
ALTER TABLE "Store" ADD COLUMN "chatLinkId" TEXT;

DO $$
DECLARE
  r RECORD;
  candidate TEXT;
BEGIN
  FOR r IN SELECT id FROM "Store" WHERE "chatLinkId" IS NULL LOOP
    LOOP
      candidate := lpad((floor(random() * 100000000))::text, 8, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "Store" WHERE "chatLinkId" = candidate);
    END LOOP;
    UPDATE "Store" SET "chatLinkId" = candidate WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE "Store" ALTER COLUMN "chatLinkId" SET NOT NULL;
ALTER TABLE "Store" ADD CONSTRAINT "Store_chatLinkId_key" UNIQUE ("chatLinkId");
