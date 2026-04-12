

import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { teacherAuthMiddleware, authMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";
import { createSession, endSession, getAllSessions, getSessionById, updateSession, getTeacherSessions } from "../controllers/SessionController";
const router = express.Router();



router.get("/my-sessions", apiLimiter, teacherAuthMiddleware, getTeacherSessions);

router.get("/", apiLimiter, authMiddleware, getAllSessions);
router.get("/:id", apiLimiter, authMiddleware, getSessionById);
router.post("/", apiLimiter, teacherAuthMiddleware, validateRequest, createSession);
router.put("/:id", apiLimiter, teacherAuthMiddleware, validateRequest, updateSession);
router.post("/:id/end", apiLimiter, teacherAuthMiddleware, validateRequest, endSession);



export default router;