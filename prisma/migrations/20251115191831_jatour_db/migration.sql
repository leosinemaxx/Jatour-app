-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "accessibilityFeatures" JSONB,
ADD COLUMN     "disabledFriendly" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "destinations_disabledFriendly_idx" ON "destinations"("disabledFriendly");
