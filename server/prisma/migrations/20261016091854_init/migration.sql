-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('SUPER_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "StoreRole" AS ENUM ('OWNER', 'ADMIN', 'SUPERVISOR', 'AGENT');

-- CreateEnum
CREATE TYPE "Presence" AS ENUM ('ONLINE', 'AWAY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ConvStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('VISITOR', 'AGENT', 'BOT', 'SYSTEM', 'NOTE');

-- CreateEnum
CREATE TYPE "ConfigStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ExecStatus" AS ENUM ('SCHEDULED', 'RUNNING', 'SUCCEEDED', 'SKIPPED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "GlobalRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "previousKey" TEXT,
    "previousKeyExpires" TIMESTAMP(3),
    "allowedOrigins" TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "notifyEmails" TEXT[],
    "emailOnNewChat" BOOLEAN NOT NULL DEFAULT true,
    "emailOnOffline" BOOLEAN NOT NULL DEFAULT true,
    "emailConfig" TEXT,
    "publishedVersion" INTEGER,
    "lastWidgetSeenAt" TIMESTAMP(3),
    "lastWidgetOrigin" TEXT,
    "lastRejectedOrigin" TEXT,
    "lastRejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreMember" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" "StoreRole" NOT NULL,
    "presence" "Presence" NOT NULL DEFAULT 'OFFLINE',
    "maxChats" INTEGER NOT NULL DEFAULT 10,
    "emailNotify" BOOLEAN NOT NULL DEFAULT true,
    "lastAssignedAt" TIMESTAMP(3),

    CONSTRAINT "StoreMember_pkey" PRIMARY KEY ("userId","storeId")
);

-- CreateTable
CREATE TABLE "WidgetConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ConfigStatus" NOT NULL,
    "config" JSONB NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WidgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visits" INTEGER NOT NULL DEFAULT 1,
    "sessionPageViews" INTEGER NOT NULL DEFAULT 0,
    "currentUrl" TEXT,
    "currentTitle" TEXT,
    "referrer" TEXT,
    "device" TEXT,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "status" "ConvStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "assigneeId" TEXT,
    "tags" TEXT[],
    "isOffline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT,
    "lastVisitorMessageAt" TIMESTAMP(3),
    "lastAgentMessageAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "unreadForAgent" INTEGER NOT NULL DEFAULT 0,
    "unreadForVisitor" INTEGER NOT NULL DEFAULT 0,
    "visitorDeliveredSeq" INTEGER NOT NULL DEFAULT 0,
    "visitorReadSeq" INTEGER NOT NULL DEFAULT 0,
    "agentReadSeq" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT,
    "senderAvatar" TEXT,
    "body" TEXT NOT NULL,
    "meta" JSONB,
    "clientMsgId" TEXT,
    "attachmentId" TEXT,
    "triggerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedReply" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "shortcut" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trigger" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "kind" TEXT NOT NULL DEFAULT 'BASIC',
    "event" TEXT NOT NULL,
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "match" TEXT NOT NULL DEFAULT 'ALL',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "frequency" TEXT NOT NULL DEFAULT 'ONCE_PER_SESSION',
    "cooldownSeconds" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerExecution" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "triggerVersion" INTEGER NOT NULL,
    "visitorId" TEXT,
    "conversationId" TEXT,
    "event" TEXT NOT NULL,
    "status" "ExecStatus" NOT NULL,
    "reason" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriggerExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageDaily" (
    "storeId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "widgetLoads" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageDaily_pkey" PRIMARY KEY ("storeId","day")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Store_publicKey_key" ON "Store"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "Store_previousKey_key" ON "Store"("previousKey");

-- CreateIndex
CREATE INDEX "StoreMember_storeId_idx" ON "StoreMember"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetConfig_storeId_version_key" ON "WidgetConfig"("storeId", "version");

-- CreateIndex
CREATE INDEX "Visitor_storeId_lastSeenAt_idx" ON "Visitor"("storeId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_storeId_tokenHash_key" ON "Visitor"("storeId", "tokenHash");

-- CreateIndex
CREATE INDEX "Conversation_storeId_status_lastMessageAt_idx" ON "Conversation"("storeId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_storeId_assigneeId_idx" ON "Conversation"("storeId", "assigneeId");

-- CreateIndex
CREATE INDEX "Conversation_visitorId_expiresAt_idx" ON "Conversation"("visitorId", "expiresAt");

-- CreateIndex
CREATE INDEX "Conversation_expiresAt_idx" ON "Conversation"("expiresAt");

-- CreateIndex
CREATE INDEX "Message_storeId_createdAt_idx" ON "Message"("storeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_seq_key" ON "Message"("conversationId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_clientMsgId_key" ON "Message"("conversationId", "clientMsgId");

-- CreateIndex
CREATE INDEX "Attachment_conversationId_idx" ON "Attachment"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedReply_storeId_shortcut_key" ON "SavedReply"("storeId", "shortcut");

-- CreateIndex
CREATE INDEX "Trigger_storeId_event_enabled_idx" ON "Trigger"("storeId", "event", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "TriggerExecution_dedupeKey_key" ON "TriggerExecution"("dedupeKey");

-- CreateIndex
CREATE INDEX "TriggerExecution_storeId_createdAt_idx" ON "TriggerExecution"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "TriggerExecution_triggerId_visitorId_status_idx" ON "TriggerExecution"("triggerId", "visitorId", "status");

-- CreateIndex
CREATE INDEX "TriggerExecution_conversationId_idx" ON "TriggerExecution"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_dedupeKey_key" ON "Job"("dedupeKey");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- CreateIndex
CREATE INDEX "Job_storeId_type_idx" ON "Job"("storeId", "type");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_createdAt_idx" ON "WebhookDelivery"("webhookId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_storeId_createdAt_idx" ON "AuditLog"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetConfig" ADD CONSTRAINT "WidgetConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReply" ADD CONSTRAINT "SavedReply_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerExecution" ADD CONSTRAINT "TriggerExecution_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
