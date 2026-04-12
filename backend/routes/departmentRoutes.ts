import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { adminAuthMiddleware, authMiddleware } from "../middleware/authMiddleware";
import { getAllDepartments, createDepartment, deleteDepartment, updateDeparment } from "../controllers/DepartmentController";
import { apiLimiter } from "../middleware/rateLimitMiddleware";


const router = express.Router();

router.get("/",
    apiLimiter,
    adminAuthMiddleware,
    getAllDepartments

);


router.post("/",
    apiLimiter,
    validateRequest,
    adminAuthMiddleware,
    createDepartment

);


router.delete("/:id",
    apiLimiter,
    adminAuthMiddleware,
    deleteDepartment

);



router.put("/:id",
    apiLimiter,
    validateRequest,
    adminAuthMiddleware,
    updateDeparment

);


export default router;