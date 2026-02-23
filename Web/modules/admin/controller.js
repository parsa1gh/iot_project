import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import personalModel from "../nurse/model.js";
export async function loginAdmin(req, res) {
  const { password, identifier, remember } = req.body;
  const private_key = process.env.JWT_secretKey;
  const admin = await personalModel.findOne({
    $and: [{ phoneNumber: identifier }, { roll: "ADMIN" }],
  });
  if (!admin) {
    return res.status(400).json({ error: "admin doesn't found" });
  }
  const isPas = bcrypt.compareSync(password, admin.password);
  if (isPas) {
    const rememberFlag = Boolean(remember);
    const expiresIn = rememberFlag ? "30d" : "1h";
    const token = jwt.sign({ data: admin._id }, private_key, { expiresIn });
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
export async function logoutAdmin(req, res) {
  res.clearCookie("authToken");
  return res.json({ message: "logout successfully" });
}
export async function dashboardPage(req, res) {
  const admin = req.personnel;
  res.render("adminDashboard", {
    name: `${admin.firstName} ${admin.lastName}`,
    id: admin._id,
  });
}
