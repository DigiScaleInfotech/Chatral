-- Visitor page-view history (navigation timeline). Additive: one new table.
-- CreateTable
CREATE TABLE "VisitorPageView" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorPageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorPageView_visitorId_createdAt_idx" ON "VisitorPageView"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "VisitorPageView_storeId_createdAt_idx" ON "VisitorPageView"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "VisitorPageView" ADD CONSTRAINT "VisitorPageView_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

