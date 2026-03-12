-- Add tone style tracking for parent report variation
ALTER TABLE "reports" ADD COLUMN "toneStyle" TEXT NOT NULL DEFAULT 'warm';
