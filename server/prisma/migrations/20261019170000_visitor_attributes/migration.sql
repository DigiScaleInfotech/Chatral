-- Pre-chat answers stored on the visitor. Additive: one nullable JSON column.
-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "attributes" JSONB;

