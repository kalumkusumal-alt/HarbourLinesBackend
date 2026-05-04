// backend/routes/exportJobRoutes.js
import express from 'express';
import {
  getAllExportJobs,
  createExportJob
} from '../controllers/exportJobController.js';

const router = express.Router();

router.get('/getAllExportJobs', getAllExportJobs);
router.post('/createExportJob', createExportJob);

export default router;