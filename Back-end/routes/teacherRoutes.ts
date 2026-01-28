import express from 'express';
import { createTeacher, getAllTeachers, updateTeacher, deleteTeacher } from '../controllers/TeacherController';

const router = express.Router();

router.route('/')
    .get(getAllTeachers)
    .post(createTeacher);

router.route('/:id')
    .put(updateTeacher)
    .delete(deleteTeacher);

export default router;
