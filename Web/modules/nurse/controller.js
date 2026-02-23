import personalModel from "./model.js";
import patientModel from "../patient/model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function createNurse(req, res) {
  try {
    const { lastName, firstName, birthday, password, phoneNumber } = req.body;
    const hashedPass = bcrypt.hashSync(password, 10);
    const nurse = await personalModel.create({
      firstName,
      password: hashedPass,
      lastName,
      birthday,
      phoneNumber,
      roll: "NURSE",
    });
    res.status(201).json({ nurse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export async function loginNurse(req, res) {
  const { password, identifier, remember } = req.body;
  const private_key = process.env.JWT_secretKey;
  const nurse = await personalModel.findOne({
    phoneNumber: identifier,
    roll: "NURSE",
  });
  if (!nurse) {
    return res.status(400).json({ error: "nurse doesn't found" });
  }
  const isPas = bcrypt.compareSync(password, nurse.password);
  if (isPas) {
    const rememberFlag = Boolean(remember);
    const expiresIn = rememberFlag ? "30d" : "1h";
    const token = jwt.sign({ data: nurse._id }, private_key, { expiresIn });
    const maxAge = rememberFlag ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // ms

    const cookieOptions = {
      httpOnly: true,
      maxAge,
      sameSite: "lax",
    };

    res.cookie("authToken", token, cookieOptions);
    return res.json({ message: "login was successful" });
  } else {
    return res.status(422).json({ error: "password is wrong" });
  }
}
export async function logoutNurse(req, res) {
  res.clearCookie("authToken");
  return res.json({ message: "logout successfully" });
}
export async function dashboardPage(req, res) {
  const nurse = req.personnel;
  res.render("nurseDashboard", {
    name: `${nurse.firstName} ${nurse.lastName}`,
    id: nurse._id,
  });
}
export async function managePage(req, res) {
  const nurse = req.personnel;
  res.render("managePatients", {
    name: `${nurse.firstName} ${nurse.lastName}`,
    id: nurse._id,
  });
}
export async function getPatients(req, res) {
  const nurse = req.personnel;
  const id = req.body?.id;
  const patients = await patientModel
    .find(
      { nurseId: id ? id : nurse },
      "firstName lastName birthday phoneNumber"
    )
    .populate("nurseId");
  return res.json({ data: patients });
}
export async function getNurse(req, res) {
  const nurses = await personalModel.find({ roll: "NURSE" });
  res.json({ nurses });
}
export async function deleteNurse(req, res) {
  let nurseId = req.params.id;
  if (!nurseId)
    return res.status(422).json({ message: "Please enter the id." });
  await personalModel.findByIdAndDelete(nurseId);
  res.sendStatus(200);
}

export async function updateNurse(req, res) {
  try {
    const nurseId = req.params.id;
    const { firstName, lastName, phoneNumber, birthday, password } = req.body;

    // پرستار فعلی
    const nurse = await personalModel.findById(nurseId);
    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "پرستار پیدا نشد",
      });
    }

    const updates = {};

    // فقط اگر تغییر کرده
    if (firstName && firstName !== nurse.firstName)
      updates.firstName = firstName;

    if (lastName && lastName !== nurse.lastName) updates.lastName = lastName;

    if (phoneNumber && phoneNumber !== nurse.phoneNumber) {
      const exists = await personalModel.findOne({
        phoneNumber,
        _id: { $ne: nurseId },
      });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "این شماره قبلاً ثبت شده است",
        });
      }
      updates.phoneNumber = phoneNumber;
    }

    if (
      birthday &&
      new Date(birthday).toISOString() !==
        new Date(nurse.birthday).toISOString()
    ) {
      updates.birthday = birthday;
    }

    // پسورد اختیاری
    if (password && password.trim().length >= 6) {
      updates.password = await bcrypt.hash(password, 10);
    }

    // اگر چیزی برای آپدیت نبود
    if (Object.keys(updates).length === 0) {
      return res.status(200).json({
        success: true,
        message: "هیچ تغییری اعمال نشد",
      });
    }

    await personalModel.findByIdAndUpdate(nurseId, updates, { new: true });

    return res.json({
      success: true,
      message: "اطلاعات پرستار با موفقیت به‌روزرسانی شد",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "خطای سرور",
    });
  }
}
