import express from "express";
const router = express.Router();
import { checkBle, checkFr, checkRfid, confirmFr } from "./controller.js";
import upload from "../../utils/multerMiddelware.js";
router.post("/rfid", checkRfid);
router.post("/ble", checkBle);
router.post("/fr", checkFr);
router.post("/frConfirm", upload.single("image"), confirmFr);
export default router;
