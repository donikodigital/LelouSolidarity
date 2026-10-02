-- AlterTable
ALTER TABLE "FormRequest" ADD COLUMN "accessCodeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FormRequest_accessCodeId_key" ON "FormRequest"("accessCodeId");

-- AddForeignKey
ALTER TABLE "FormRequest" ADD CONSTRAINT "FormRequest_accessCodeId_fkey" FOREIGN KEY ("accessCodeId") REFERENCES "AccessCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;