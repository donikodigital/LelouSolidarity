-- CreateTable
CREATE TABLE "FormRequest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormRequest_handled_idx" ON "FormRequest"("handled");

-- CreateIndex
CREATE INDEX "FormRequest_createdAt_idx" ON "FormRequest"("createdAt");