-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "department_id" BIGINT;

-- CreateIndex
CREATE INDEX "Admin_department_id_idx" ON "Admin"("department_id");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
