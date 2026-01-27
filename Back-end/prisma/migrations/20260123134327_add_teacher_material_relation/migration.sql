-- CreateTable
CREATE TABLE "TeacherMaterial" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacher_id" BIGINT NOT NULL,
    "material_id" BIGINT NOT NULL,

    CONSTRAINT "TeacherMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherMaterial_teacher_id_idx" ON "TeacherMaterial"("teacher_id");

-- CreateIndex
CREATE INDEX "TeacherMaterial_material_id_idx" ON "TeacherMaterial"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherMaterial_teacher_id_material_id_key" ON "TeacherMaterial"("teacher_id", "material_id");

-- AddForeignKey
ALTER TABLE "TeacherMaterial" ADD CONSTRAINT "TeacherMaterial_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherMaterial" ADD CONSTRAINT "TeacherMaterial_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
