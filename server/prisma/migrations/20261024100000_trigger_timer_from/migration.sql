-- Where a trigger's Delay is counted from: EVENT (previous behaviour, default for every existing trigger),
-- LAST_VISITOR (last customer message) or LAST_MESSAGE (last customer or agent message).
ALTER TABLE "Trigger" ADD COLUMN "timerFrom" TEXT NOT NULL DEFAULT 'EVENT';
