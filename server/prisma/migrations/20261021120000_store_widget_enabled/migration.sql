-- Master on/off switch for a store's website widget. Default on: existing stores unchanged.
ALTER TABLE "Store" ADD COLUMN "widgetEnabled" BOOLEAN NOT NULL DEFAULT true;
