-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('DEAN', 'DEPARTMENT_HEAD');

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'DEPARTMENT_HEAD';

-- CreateIndex
CREATE INDEX "Admin_role_idx" ON "Admin"("role");
