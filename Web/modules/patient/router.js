import express from "express";
const router = express.Router();
import {
  patientCreate,
  patientLogin,
  getPatient,
  deletePatient,
  updatePatient,
} from "./controller.js";
import { patientValidatorSchema } from "../../validator/validations.js";
import { validateRequest } from "../../middlewares/verification.js";
import { isToken, isPersonnel } from "../../middlewares/tokenVerify.js";

// add new patient
router
  .route("")
  .post(validateRequest(patientValidatorSchema), patientCreate)
  .get(isToken, isPersonnel, getPatient);
router.post("/login", patientLogin);
router.delete("/:id", validateRequest(patientValidatorSchema), deletePatient);
router.put("/:id", validateRequest(patientValidatorSchema), updatePatient);
export default router;
