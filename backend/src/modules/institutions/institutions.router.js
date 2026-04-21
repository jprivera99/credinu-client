import { Router } from "express";
import {
  getInstitutions,
  getInstitutionById,
} from "./institutions.controller.js";

const router = Router();

router.get("/get-institutions", getInstitutions);
router.get("/get-institution", getInstitutionById);

export default router;