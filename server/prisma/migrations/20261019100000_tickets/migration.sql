-- Tickets. Additive only: new enums/tables and Store.ticketSeq (default 0).
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketSender" AS ENUM ('AGENT', 'CUSTOMER', 'NOTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('NONE', 'QUEUED', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "ticketSeq" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT NOT NULL,
    "cc" TEXT[],
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "assigneeId" TEXT,
    "tags" TEXT[],
    "conversationId" TEXT,
    "visitorId" TEXT,
    "createdById" TEXT,
    "requestId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderType" "TicketSender" NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT,
    "body" TEXT NOT NULL,
    "clientMsgId" TEXT,
    "emailStatus" "EmailStatus" NOT NULL DEFAULT 'NONE',
    "emailError" TEXT,
    "emailMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAttachment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "ticketId" TEXT,
    "messageId" TEXT,
    "uploadedById" TEXT,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ticket_storeId_status_lastMessageAt_idx" ON "Ticket"("storeId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Ticket_storeId_assigneeId_idx" ON "Ticket"("storeId", "assigneeId");

-- CreateIndex
CREATE INDEX "Ticket_storeId_conversationId_idx" ON "Ticket"("storeId", "conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_storeId_number_key" ON "Ticket"("storeId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_storeId_requestId_key" ON "Ticket"("storeId", "requestId");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TicketMessage_ticketId_clientMsgId_key" ON "TicketMessage"("ticketId", "clientMsgId");

-- CreateIndex
CREATE INDEX "TicketAttachment_storeId_ticketId_idx" ON "TicketAttachment"("storeId", "ticketId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TicketMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

