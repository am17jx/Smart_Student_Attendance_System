

import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { teacherAuthMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";
import { createSession, endSession, getAllSessions, getSessionById, updateSession } from "../controllers/SessionController";
const router = express.Router();


router.get("/", apiLimiter, teacherAuthMiddleware, getAllSessions);
router.get("/:id", apiLimiter, teacherAuthMiddleware, getSessionById);
router.post("/", apiLimiter, teacherAuthMiddleware, validateRequest, createSession);
router.put("/:id", apiLimiter, teacherAuthMiddleware, validateRequest, updateSession);
router.post("/:id/close", apiLimiter, teacherAuthMiddleware, validateRequest, endSession);



export default router;