import express from "express";
import {
    getAllStudents,
    updateStudent,
    deleteStudent,
    resetFingerprint,

} from "../controllers/StudentController";
import { authMiddleware, adminAuthMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// All student routes require admin authentication
router.use(adminAuthMiddleware);

router.get("/", getAllStudents);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);
router.put("/:id/reset-fingerprint", resetFingerprint);


export default router;
