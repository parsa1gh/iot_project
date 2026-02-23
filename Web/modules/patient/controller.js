import patientModel from "./model.js";
import nurseModel from "../nurse/model.js";
import {
  getBle,
  getRfid,
  getFr,
  refreshRfid,
  refreshBle,
  refreshFr,
  getImg,
} from "../recognition/controller.js";
import path from "path";
import fs from "fs";
import personalModel from "../nurse/model.js";
export async function patientCreate(req, res) {
  try {
    const { lastName, firstName, phoneNumber, password, birthday } = req.body;
    const rfId = getRfid(); // این تابع باید از جایی RFID رو بخونه
    if (!rfId) {
      return res.status(400).json({
        success: false,
        message: "RFID مورد نیاز است. لطفا کارت را اسکن کنید",
      });
    }
    refreshRfid();
    const ble = getBle();
    if (!ble) {
      return res.status(400).json({
        success: false,
        message: "BLE مورد نیاز است. لطفا کارت را اسکن کنید",
      });
    }
    refreshBle();
    const fr = getFr();
    if (!fr) {
      return res.status(400).json({
        success: false,
        message: "FR مورد نیاز است. لطفا صورت را اسکن کنید",
      });
    }
    refreshFr();
    const existingPatient = await patientModel.findOne({
      $or: [{ ble: ble }, { rfId: rfId }, { fr: fr }],
    });
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: "این اطلاعات قبلا ثبت شده است",
      });
    }

    const existingNursePhoneNumber = await personalModel.find({ phoneNumber });
    const existingPatientPhoneNumber = await patientModel.find({ phoneNumber });
    if (
      existingNursePhoneNumber.length > 0 ||
      existingPatientPhoneNumber.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message: "این شماره قبلا ثبت شده است.",
      });
    }
    const chosenNurse = await personalModel
      .findOne({ roll: "NURSE" })
      .sort({ patientsCount: 1 });

    const nurseId = chosenNurse._id;
    await personalModel.findOneAndUpdate(
      { _id: nurseId },
      { $inc: { patientsCount: 1 } },
      { new: true }
    );
    saveImage(getImg());
    const newPatient = await patientModel.create({
      firstName,
      lastName,
      phoneNumber,
      rfId,
      ble,
      fr,
      birthday,
      password,
      nurseId,
    });
    res.status(201).json({ newPatient });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}
export async function patientLogin(req, res) {
  const { phoneNumber, password } = req.body;
}
export async function getPatient(req, res) {
  try {
    const patients = await patientModel
      .find()
      .populate("nurseId", "firstName lastName");
    return res.json(patients);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
export async function updatePatient(req, res) {
  try {
    const { lastName, firstName, phoneNumber, birthday } = req.body;
    const patientId = req.params.id;

    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "بیمار یافت نشد",
      });
    }

    //  Get identifiers

    const rfId = getRfid();
    refreshRfid();

    const ble = getBle();
    refreshBle();

    const fr = getFr();
    refreshFr();

    //  Conflict check (ignore self)

    const conflictPatient = await patientModel.findOne({
      _id: { $ne: patientId },
      $or: [{ rfId }, { ble }, { fr }],
    });

    if (conflictPatient) {
      return res.status(409).json({
        success: false,
        message: "اطلاعات شناسایی قبلاً برای بیمار دیگری ثبت شده است",
      });
    }

    const phoneConflict =
      (await personalModel.findOne({ phoneNumber })) ||
      (await patientModel.findOne({
        phoneNumber,
        _id: { $ne: patientId },
      }));

    if (phoneConflict) {
      return res.status(409).json({
        success: false,
        message: "این شماره تلفن قبلاً ثبت شده است",
      });
    }

    //  Build updates dynamically

    const updates = {};

    if (firstName && firstName !== patient.firstName)
      updates.firstName = firstName;

    if (lastName && lastName !== patient.lastName) updates.lastName = lastName;

    if (
      birthday &&
      new Date(birthday).getTime() !== new Date(patient.birthday).getTime()
    )
      updates.birthday = birthday;

    if (phoneNumber && phoneNumber !== patient.phoneNumber)
      updates.phoneNumber = phoneNumber;

    if (rfId && rfId !== patient.rfId) updates.rfId = rfId;
    if (ble && ble !== patient.ble) updates.ble = ble;
    if (fr && fr !== patient.fr) updates.fr = fr;

    //  No changes?

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({
        success: true,
        message: "هیچ تغییری اعمال نشد",
      });
    }

    //  Update

    await patientModel.findByIdAndUpdate(patientId, updates, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "اطلاعات بیمار با موفقیت به‌روزرسانی شد",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "خطای سرور",
    });
  }
}

export async function deletePatient(req, res) {
  let patientId = req.params.id;
  if (!patientId)
    return res.status(422).json({ message: "Please enter the id." });
  await patientModel.findByIdAndDelete(patientId);
  res.sendStatus(200);
}
async function saveImage(data) {
  // مسیر ذخیره
  const filePath = path.join("./public/avatars", `image_${Date.now()}.jpg`);
  const buffer = Buffer.from(data);
  // ذخیره
  fs.writeFileSync(filePath, buffer);
  return filePath;
}
