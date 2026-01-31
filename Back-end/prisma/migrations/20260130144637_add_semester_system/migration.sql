-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('SEMESTER_1', 'SEMESTER_2', 'FULL_YEAR');

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "semester" "Semester" NOT NULL DEFAULT 'FULL_YEAR';
