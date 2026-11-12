-- Ban visitors + Trash/Spam folders. Additive only (new enum, nullable columns, folder defaults to INBOX).
-- CreateEnum
CREATE TYPE "ConvFolder" AS ENUM ('INBOX', 'TRASH', 'SPAM');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "folder" "ConvFolder" NOT NULL DEFAULT 'INBOX',
ADD COLUMN     "folderChangedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedById" TEXT;

-- CreateIndex
CREATE INDEX "Conversation_storeId_folder_status_lastMessageAt_idx" ON "Conversation"("storeId", "folder", "status", "lastMessageAt");

