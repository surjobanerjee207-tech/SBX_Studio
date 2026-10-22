-- Set payment QR defaults to the studio UPI QR card
UPDATE "StudioSettings"
SET "showPaymentQr" = true,
    "qrMode" = 'custom',
    "customQrUrl" = '/payment-qr.jpg',
    "qrCaption" = 'Scan to pay with any UPI app'
WHERE "id" = 'default';

-- Fix Invoice existing rows: treat null or false as true
UPDATE "Invoice"
SET "showPaymentQr" = true
WHERE "showPaymentQr" IS NULL OR "showPaymentQr" = false;
