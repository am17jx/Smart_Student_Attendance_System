import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { teacherAuthMiddleware, studentAuthMiddleware } from "../middleware/authMiddleware";
import { qrScanLimiter, generalLimiter } from "../middleware/rateLimiter";
import { generateQrForSession, scanQrAndAttend, getSessionQrCodes } from "../controllers/QrcodeController";
const router = express.Router();



router.post("/generate/:session_id", generalLimiter, teacherAuthMiddleware, validateRequest, generateQrForSession);
router.post("/validate", qrScanLimiter, studentAuthMiddleware, validateRequest, scanQrAndAttend);
router.get("/session/:session_id", generalLimiter, teacherAuthMiddleware, validateRequest, getSessionQrCodes);




export default router;



