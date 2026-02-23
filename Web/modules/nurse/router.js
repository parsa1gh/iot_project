import express from "express";
const router = express.Router();
import {
  createNurse,
  dashboardPage,
  deleteNurse,
  getNurse,
  getPatients,
  loginNurse,
  logoutNurse,
  managePage,
  updateNurse,
} from "./controller.js";

import { validateRequest } from "../../middlewares/verification.js";
import {
  nurseLoginSchema,
  nurseRegisterSchema,
  nurseUpdateSchema,
} from "../../validator/validations.js";
import { isPersonnel, isToken } from "../../middlewares/tokenVerify.js";

router.route("/").get(isToken, isPersonnel, getNurse).post(logoutNurse);
router
  .route("/:id")
  .delete(isToken, isPersonnel, deleteNurse)
  .put(validateRequest(nurseUpdateSchema), updateNurse);
// router.get("/:id/patients",)
router.post("/create", validateRequest(nurseRegisterSchema), createNurse);
router.post("/login", validateRequest(nurseLoginSchema), loginNurse);
router.get("/dashboard", isToken, isPersonnel, dashboardPage);
router.get("/managePatients", isToken, isPersonnel, managePage);
router.post("/getPatients", isToken, isPersonnel, getPatients);

export default router;
