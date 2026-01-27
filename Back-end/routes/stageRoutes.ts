
import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { adminAuthMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";
import { getAllStages, createStage, deleteStage, updateStage } from "../controllers/StageController";

const router = express.Router();

router.get("/",
    apiLimiter,
    adminAuthMiddleware,
    getAllStages
)

router.post("/",
    apiLimiter,
    adminAuthMiddleware,
    validateRequest,
    createStage
)

router.put("/:id",
    apiLimiter,
    adminAuthMiddleware,
    validateRequest,
    updateStage
)

router.delete("/:id",
    apiLimiter,
    adminAuthMiddleware,
    validateRequest,
    deleteStage
)
export default router;