import express from "express";
const router = express.Router();
import { loginAdmin, logoutAdmin, dashboardPage } from "./controller.js";

import {
  isAdmin,
  isPersonnel,
  isToken,
} from "../../middlewares/tokenVerify.js";

import { validateRequest } from "../../middlewares/verification.js";
import { adminLoginSchema } from "../../validator/validations.js";

router.route("/").post(isToken, isAdmin, logoutAdmin);
router.post("/login", validateRequest(adminLoginSchema), loginAdmin);
router.get("/dashboard", isToken, isAdmin, dashboardPage);
export default router;
