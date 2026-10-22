-- AlterTable
ALTER TABLE "StudioSettings" ADD COLUMN "showPaymentQr" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "qrMode" TEXT NOT NULL DEFAULT 'auto',
ADD COLUMN "customQrUrl" TEXT,
ADD COLUMN "qrCaption" TEXT DEFAULT 'Scan to pay';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "showPaymentQr" BOOLEAN NOT NULL DEFAULT true;
