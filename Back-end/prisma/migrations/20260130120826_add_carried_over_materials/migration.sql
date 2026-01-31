-- CreateTable
CREATE TABLE "CarriedOverMaterial" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "student_id" BIGINT NOT NULL,
    "material_id" BIGINT NOT NULL,
    "original_stage_id" BIGINT NOT NULL,

    CONSTRAINT "CarriedOverMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarriedOverMaterial_student_id_idx" ON "CarriedOverMaterial"("student_id");

-- CreateIndex
CREATE INDEX "CarriedOverMaterial_material_id_idx" ON "CarriedOverMaterial"("material_id");

-- CreateIndex
CREATE INDEX "CarriedOverMaterial_original_stage_id_idx" ON "CarriedOverMaterial"("original_stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "CarriedOverMaterial_student_id_material_id_key" ON "CarriedOverMaterial"("student_id", "material_id");

-- AddForeignKey
ALTER TABLE "CarriedOverMaterial" ADD CONSTRAINT "CarriedOverMaterial_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarriedOverMaterial" ADD CONSTRAINT "CarriedOverMaterial_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarriedOverMaterial" ADD CONSTRAINT "CarriedOverMaterial_original_stage_id_fkey" FOREIGN KEY ("original_stage_id") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
