import { getIO } from "../../services/socket.js";
import patientModel from "../patient/model.js";
let lastRFID = null;
let lastBLE = null;
let lastFR = null;
let img;
export function getRfid() {
  return lastRFID;
}
export function getImg() {
  return img;
}
export function refreshRfid() {
  lastRFID = null;
}

export function getBle() {
  return lastBLE;
}

export function refreshBle() {
  lastBLE = null;
}

export function getFr() {
  return lastFR;
}

export function refreshFr() {
  lastFR = null;
}

async function processScan(
  req,
  res,
  { dbField, setLast, emptyMessage, notFoundMessage, fnName, isFace = false }
) {
  try {
    let value;

    if (isFace) {
      let imgBuffer = req.body;
      const response = await fetch("http://0.0.0.0:5000/recognize", {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: imgBuffer,
      });

      const result = await response.json();
      if (!result.faces || result.faces.length === 0) {
        return res.status(200).json({ errMessage: emptyMessage });
      }
      value = result.faces[0].embedding;
    } else {
      const raw = req.body?.data;
      value =
        typeof raw === "string"
          ? raw.trim().toUpperCase()
          : raw != null
          ? String(raw)
          : "";
      if (!value) {
        return res.status(400).json({ errMessage: emptyMessage });
      }
    }

    let matchedPatient = null;

    if (isFace) {
      const patients = await patientModel
        .find({ [dbField]: { $exists: true } })
        .lean();
      let maxSim = 0;
      const threshold = 0.5;

      for (const patient of patients) {
        const sim = cosineSimilarity(value, patient[dbField]);
        if (sim > threshold && sim > maxSim) {
          maxSim = sim;
          matchedPatient = patient;
        }
      }
    } else {
      matchedPatient = await patientModel.findOne({ [dbField]: value }).lean();
    }
    if (matchedPatient) {
      return res.json({
        data: `${matchedPatient.firstName} ${matchedPatient.lastName}`,
      });
    }
    //saving the picture
    img = req.body;
    // saving the finger print of FR
    setLast(value);
    // آماده کردن payload برای WebSocket
    const io = getIO();
    const payload = {
      device: dbField.toLowerCase(),
      value,
      picture: "",
      timestamp: new Date().toISOString(),
    };
    if (io) io.emit("recognition:scan", payload);
    return res.json({ message: notFoundMessage });
  } catch (err) {
    console.error(`Error in ${fnName}:`, err);
    return res.status(500).json({ errMessage: "Internal server error" });
  }
}

function cosineSimilarity(a, b) {
  let dot = 0.0,
    normA = 0.0,
    normB = 0.0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
export async function checkRfid(req, res) {
  return processScan(req, res, {
    dbField: "rfId",
    setLast: (v) => {
      lastRFID = v;
    },
    emptyMessage: "please scan the RFID again",
    notFoundMessage: "RFID scanned",
    fnName: "checkRfid",
  });
}

export async function checkBle(req, res) {
  return processScan(req, res, {
    dbField: "ble",
    setLast: (v) => {
      lastBLE = v;
    },
    emptyMessage: "please scan the BLE again",
    notFoundMessage: "BLE Tag scanned",
    fnName: "checkBle",
  });
}

export async function checkFr(req, res) {
  return processScan(req, res, {
    dbField: "fr",
    setLast: (v) => {
      lastFR = v;
    },
    emptyMessage: "please scan the FR again",
    notFoundMessage: "Face recognized",
    fnName: "checkFr",
    isFace: true,
  });
}
export async function confirmFr(req, res) {
  let picture = req.body;
  const io = getIO();

  // ارسال مستقیم باینری
  io.emit("image", req.body);

  return res.json({ ok: true });
}
