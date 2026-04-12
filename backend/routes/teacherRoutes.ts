import express from 'express';
import { createTeacher, getAllTeachers, updateTeacher, deleteTeacher, getMyStudents } from '../controllers/TeacherController';
import { adminAuthMiddleware, teacherAuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// GET /teachers/my-students - Get students for logged-in teacher (Teacher only)
router.get("/my-students", teacherAuthMiddleware, getMyStudents);

// All other teacher routes require admin authentication
router.use(adminAuthMiddleware);

router.get("/", getAllTeachers);
router.post("/", createTeacher);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

export default router;
