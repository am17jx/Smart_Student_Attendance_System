
import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { adminAuthMiddleware, authMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";
import { createGeofence, deleteGeofence, getAllGeofences, updateGeofence } from "../controllers/GeofenceController";
const router = express.Router();


router.get("/", apiLimiter, authMiddleware, getAllGeofences);
router.post("/", apiLimiter, adminAuthMiddleware, validateRequest, createGeofence);
router.put("/:id", apiLimiter, adminAuthMiddleware, validateRequest, updateGeofence);
router.delete("/:id", apiLimiter, adminAuthMiddleware, validateRequest, deleteGeofence);





export default router;