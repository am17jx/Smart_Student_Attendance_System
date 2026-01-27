import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { teacherAuthMiddleware, studentAuthMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";
import { generateQrForSession, scanQrAndAttend, getSessionQrCodes } from "../controllers/QrcodeController";
const router = express.Router();



router.post("/generate/:session_id", apiLimiter, teacherAuthMiddleware, validateRequest, generateQrForSession);
router.post("/validate", apiLimiter, studentAuthMiddleware, validateRequest, scanQrAndAttend);
router.get("/session/:session_id", apiLimiter, teacherAuthMiddleware, validateRequest, getSessionQrCodes);




export default router;



