-- AlterTable
ALTER TABLE "StudioSettings" ADD COLUMN IF NOT EXISTS "showMainQr" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StudioSettings" ADD COLUMN IF NOT EXISTS "showBackupQr" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StudioSettings" ADD COLUMN IF NOT EXISTS "backupQrUrl" TEXT;
ALTER TABLE "StudioSettings" ADD COLUMN IF NOT EXISTS "backupQrCaption" TEXT DEFAULT 'Backup QR: enter the amount manually';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "showMainQr" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "showBackupQr" BOOLEAN NOT NULL DEFAULT false;

-- Copy customQrUrl to backupQrUrl if populated and backupQrUrl is null
UPDATE "StudioSettings"
SET "backupQrUrl" = "customQrUrl"
WHERE "backupQrUrl" IS NULL AND "customQrUrl" IS NOT NULL;
