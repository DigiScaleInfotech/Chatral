-- Shopify integration settings per store. Additive: two nullable columns.
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "shopifyDomain" TEXT,
ADD COLUMN     "shopifyToken" TEXT;

