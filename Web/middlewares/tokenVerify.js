import jwt from "jsonwebtoken";
import personalModel from "../modules/nurse/model.js";
const privateKey = process.env.JWT_secretKey;
export async function isToken(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(403).render("403");
  }
  try {
    const decoded = jwt.verify(token, privateKey);
    req.personal = decoded.data;
    next();
  } catch (err) {
    return res.status(403).render("403");
  }
}

export async function isPersonnel(req, res, next) {
  let personal = await personalModel.findById(req.personal);
  if (!personal) {
    return res.status(403).render("403");
  }
  personal = JSON.parse(JSON.stringify(personal));
  delete personal.password;
  req.personnel = personal;
  next();
}

export async function isAdmin(req, res, next) {
  let admin = await personalModel.findById(req.personal);
  if (!admin || admin.roll != "ADMIN") {
    return res.status(403).render("403");
  }
  admin = JSON.parse(JSON.stringify(admin));
  delete admin.password;
  req.personnel = admin;
  next();
}

