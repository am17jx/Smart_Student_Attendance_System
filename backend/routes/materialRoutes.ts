
import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { adminAuthMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";
import { createMaterial, deleteMaterial, getAllMaterials, updateMaterial, getMaterialsByDepartment, getMaterialsByStage, assignTeacherToMaterial, removeTeacherFromMaterial, getTeacherMaterials } from "../controllers/MaterialController";
const router = express.Router();



router.get("/", apiLimiter, adminAuthMiddleware, getAllMaterials);
router.post("/", apiLimiter, adminAuthMiddleware, validateRequest, createMaterial);
router.put("/:id", apiLimiter, adminAuthMiddleware, validateRequest, updateMaterial);
router.delete("/:id", apiLimiter, adminAuthMiddleware, validateRequest, deleteMaterial);
import { teacherAuthMiddleware } from "../middleware/authMiddleware";

router.get("/my-materials", apiLimiter, teacherAuthMiddleware, getTeacherMaterials);

router.get("/department/:departmentId", apiLimiter, adminAuthMiddleware, validateRequest, getMaterialsByDepartment);
router.get("/stage/:stageId", apiLimiter, adminAuthMiddleware, validateRequest, getMaterialsByStage);

// Teacher assignment routes
router.post("/:id/assign-teacher", apiLimiter, adminAuthMiddleware, validateRequest, assignTeacherToMaterial);
router.delete("/:id/remove-teacher", apiLimiter, adminAuthMiddleware, validateRequest, removeTeacherFromMaterial);


export default router;