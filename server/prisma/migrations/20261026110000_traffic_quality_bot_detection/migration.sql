-- Traffic Quality & Bot Detection: additive columns only
ALTER TABLE "Visitor"
  ADD COLUMN "isBot"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "trafficType" TEXT NOT NULL DEFAULT 'HUMAN';

CREATE INDEX "Visitor_storeId_isBot_lastSeenAt_idx" ON "Visitor"("storeId", "isBot", "lastSeenAt");

ALTER TABLE "VisitorPageView"
  ADD COLUMN "isBot"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "trafficType" TEXT NOT NULL DEFAULT 'HUMAN';

CREATE INDEX "VisitorPageView_storeId_isBot_createdAt_idx" ON "VisitorPageView"("storeId", "isBot", "createdAt");
