import express from "express";
import { getAllStudents, updateStudent, deleteStudent, resetFingerprint } from "../controllers/StudentController";
import { authMiddleware, adminAuthMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

router.get("/", getAllStudents);

// Admin only for updates/deletes (or teacher depending on rules, but usually admin manages users)
router.use(adminAuthMiddleware);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);
router.put("/:id/reset-fingerprint", resetFingerprint);

export default router;
