/*
  Warnings:

  - You are about to drop the `CarriedOverMaterial` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('REGULAR', 'CARRYING', 'REPEATING');

-- CreateEnum
CREATE TYPE "SubjectResultStatus" AS ENUM ('PASSED', 'FAILED', 'BLOCKED_BY_ABSENCE', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "PromotionDecision" AS ENUM ('PROMOTED', 'PROMOTED_WITH_CARRY', 'REPEAT_YEAR');

-- DropForeignKey
ALTER TABLE "CarriedOverMaterial" DROP CONSTRAINT "CarriedOverMaterial_material_id_fkey";

-- DropForeignKey
ALTER TABLE "CarriedOverMaterial" DROP CONSTRAINT "CarriedOverMaterial_original_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "CarriedOverMaterial" DROP CONSTRAINT "CarriedOverMaterial_student_id_fkey";

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "is_core_subject" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prerequisites" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "academic_status" "AcademicStatus" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "academic_year" TEXT;

-- DropTable
DROP TABLE "CarriedOverMaterial";

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" BIGSERIAL NOT NULL,
    "academic_year" TEXT NOT NULL,
    "result_status" "SubjectResultStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "is_carried" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "student_id" BIGINT NOT NULL,
    "material_id" BIGINT NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRecord" (
    "id" BIGSERIAL NOT NULL,
    "academic_year_from" TEXT NOT NULL,
    "academic_year_to" TEXT NOT NULL,
    "decision" "PromotionDecision" NOT NULL,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "carried_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_by" TEXT,
    "student_id" BIGINT NOT NULL,
    "stage_from_id" BIGINT,
    "stage_to_id" BIGINT,

    CONSTRAINT "PromotionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarriedSubject" (
    "id" BIGSERIAL NOT NULL,
    "academic_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "student_id" BIGINT NOT NULL,
    "material_id" BIGINT NOT NULL,

    CONSTRAINT "CarriedSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionConfig" (
    "id" BIGSERIAL NOT NULL,
    "max_carry_subjects" INTEGER NOT NULL DEFAULT 2,
    "fail_threshold_for_repeat" INTEGER NOT NULL DEFAULT 3,
    "disable_carry_for_final_year" BOOLEAN NOT NULL DEFAULT false,
    "block_carry_for_core" BOOLEAN NOT NULL DEFAULT false,
    "repeat_mode" TEXT NOT NULL DEFAULT 'repeat_failed_only',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "department_id" BIGINT NOT NULL,

    CONSTRAINT "PromotionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enrollment_student_id_idx" ON "Enrollment"("student_id");

-- CreateIndex
CREATE INDEX "Enrollment_material_id_idx" ON "Enrollment"("material_id");

-- CreateIndex
CREATE INDEX "Enrollment_academic_year_idx" ON "Enrollment"("academic_year");

-- CreateIndex
CREATE INDEX "Enrollment_result_status_idx" ON "Enrollment"("result_status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_student_id_material_id_academic_year_key" ON "Enrollment"("student_id", "material_id", "academic_year");

-- CreateIndex
CREATE INDEX "PromotionRecord_student_id_idx" ON "PromotionRecord"("student_id");

-- CreateIndex
CREATE INDEX "PromotionRecord_academic_year_from_idx" ON "PromotionRecord"("academic_year_from");

-- CreateIndex
CREATE INDEX "PromotionRecord_academic_year_to_idx" ON "PromotionRecord"("academic_year_to");

-- CreateIndex
CREATE INDEX "PromotionRecord_decision_idx" ON "PromotionRecord"("decision");

-- CreateIndex
CREATE INDEX "CarriedSubject_student_id_idx" ON "CarriedSubject"("student_id");

-- CreateIndex
CREATE INDEX "CarriedSubject_material_id_idx" ON "CarriedSubject"("material_id");

-- CreateIndex
CREATE INDEX "CarriedSubject_academic_year_idx" ON "CarriedSubject"("academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "CarriedSubject_student_id_material_id_academic_year_key" ON "CarriedSubject"("student_id", "material_id", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionConfig_department_id_key" ON "PromotionConfig"("department_id");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecord" ADD CONSTRAINT "PromotionRecord_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecord" ADD CONSTRAINT "PromotionRecord_stage_from_id_fkey" FOREIGN KEY ("stage_from_id") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecord" ADD CONSTRAINT "PromotionRecord_stage_to_id_fkey" FOREIGN KEY ("stage_to_id") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarriedSubject" ADD CONSTRAINT "CarriedSubject_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarriedSubject" ADD CONSTRAINT "CarriedSubject_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionConfig" ADD CONSTRAINT "PromotionConfig_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
