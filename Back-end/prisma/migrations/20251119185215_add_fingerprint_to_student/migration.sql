/*
  Warnings:

  - You are about to drop the column `fingerprint_hash` on the `AttendanceRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "fingerprint_hash";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "fingerprint_hash" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
