-- Customer Activity Analytics: additive columns only, on the existing Visitor and VisitorPageView
-- tables (no new tables, no data loss, no destructive change).
ALTER TABLE "Visitor"
  ADD COLUMN "region"           TEXT,
  ADD COLUMN "timezone"         TEXT,
  ADD COLUMN "landingUrl"       TEXT,
  ADD COLUMN "firstReferrer"    TEXT,
  ADD COLUMN "firstUtmSource"   TEXT,
  ADD COLUMN "firstUtmMedium"   TEXT,
  ADD COLUMN "firstUtmCampaign" TEXT,
  ADD COLUMN "utmSource"        TEXT,
  ADD COLUMN "utmMedium"        TEXT,
  ADD COLUMN "utmCampaign"      TEXT;

ALTER TABLE "VisitorPageView"
  ADD COLUMN "isLanding"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source"     TEXT,
  ADD COLUMN "newSession" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "VisitorPageView_storeId_isLanding_createdAt_idx" ON "VisitorPageView"("storeId", "isLanding", "createdAt");
