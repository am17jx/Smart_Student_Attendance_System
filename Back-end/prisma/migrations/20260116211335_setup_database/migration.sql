/*
  Warnings:

  - You are about to alter the column `latitude` on the `AttendanceRecord` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `longitude` on the `AttendanceRecord` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `latitude` on the `Geofence` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `longitude` on the `Geofence` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `mustChangePassword` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Geofence` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,department_id,stage_id]` on the table `Material` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[level]` on the table `Stage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Made the column `marked_by` on table `AttendanceRecord` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Geofence` table without a default value. This is not possible if the table is not empty.
  - Made the column `radius_meters` on table `Geofence` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AttendanceRecord" ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "marked_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Geofence" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "radius_meters" SET NOT NULL;

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Stage" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "mustChangePassword",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "AttendanceRecord_session_id_idx" ON "AttendanceRecord"("session_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_marked_at_idx" ON "AttendanceRecord"("marked_at");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "FailedAttempt_session_id_idx" ON "FailedAttempt"("session_id");

-- CreateIndex
CREATE INDEX "FailedAttempt_student_id_idx" ON "FailedAttempt"("student_id");

-- CreateIndex
CREATE INDEX "FailedAttempt_attempted_at_idx" ON "FailedAttempt"("attempted_at");

-- CreateIndex
CREATE INDEX "FailedAttempt_error_type_idx" ON "FailedAttempt"("error_type");

-- CreateIndex
CREATE UNIQUE INDEX "Geofence_name_key" ON "Geofence"("name");

-- CreateIndex
CREATE INDEX "Material_department_id_idx" ON "Material"("department_id");

-- CreateIndex
CREATE INDEX "Material_stage_id_idx" ON "Material"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "Material_name_department_id_stage_id_key" ON "Material"("name", "department_id", "stage_id");

-- CreateIndex
CREATE INDEX "QRToken_session_id_idx" ON "QRToken"("session_id");

-- CreateIndex
CREATE INDEX "QRToken_used_by_student_id_idx" ON "QRToken"("used_by_student_id");

-- CreateIndex
CREATE INDEX "QRToken_expires_at_idx" ON "QRToken"("expires_at");

-- CreateIndex
CREATE INDEX "Session_teacher_id_idx" ON "Session"("teacher_id");

-- CreateIndex
CREATE INDEX "Session_material_id_idx" ON "Session"("material_id");

-- CreateIndex
CREATE INDEX "Session_geofence_id_idx" ON "Session"("geofence_id");

-- CreateIndex
CREATE INDEX "Session_session_date_idx" ON "Session"("session_date");

-- CreateIndex
CREATE INDEX "Session_is_active_idx" ON "Session"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_level_key" ON "Stage"("level");

-- CreateIndex
CREATE INDEX "Student_department_id_idx" ON "Student"("department_id");

-- CreateIndex
CREATE INDEX "Student_stage_id_idx" ON "Student"("stage_id");

-- CreateIndex
CREATE INDEX "Student_email_idx" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Teacher_department_id_idx" ON "Teacher"("department_id");

-- CreateIndex
CREATE INDEX "Teacher_email_idx" ON "Teacher"("email");
