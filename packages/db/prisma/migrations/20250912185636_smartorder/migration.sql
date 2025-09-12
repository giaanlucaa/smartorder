-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "showBackToMenu" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showForgotCta" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPaymentLoading" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "uiConfig" JSONB;
