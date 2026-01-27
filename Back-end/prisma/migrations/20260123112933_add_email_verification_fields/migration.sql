-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verification_expires" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" TEXT,
ADD COLUMN     "password_reset_expires" TIMESTAMP(3),
ADD COLUMN     "email_verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_verification_token_key" ON "Student"("email_verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "Student_password_reset_token_key" ON "Student"("password_reset_token");

-- CreateIndex
CREATE INDEX "Student_email_verification_token_idx" ON "Student"("email_verification_token");

-- CreateIndex
CREATE INDEX "Student_password_reset_token_idx" ON "Student"("password_reset_token");
