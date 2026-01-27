-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "fingerprint_hash" TEXT;

-- AlterTable
ALTER TABLE "FailedAttempt" ADD COLUMN     "fingerprint_hash" TEXT;
