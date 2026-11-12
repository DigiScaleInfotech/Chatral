-- Shortcut (saved reply) access levels. Additive: existing replies become PUBLIC.
CREATE TYPE "ReplyAccess" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "SavedReply" ADD COLUMN "access" "ReplyAccess" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "ownerId" TEXT;

CREATE INDEX "SavedReply_storeId_ownerId_idx" ON "SavedReply"("storeId", "ownerId");
