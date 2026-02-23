import personalModel from "./modules/nurse/model.js";
import bcrypt from "bcrypt";
export async function createDefaultAdmin() {
  const adminExists = await personalModel.findOne({ roll: "ADMIN" });
  let password = "admin0";
  let hashedPass = bcrypt.hashSync(password, 10);
  if (!adminExists) {
    await personalModel.create({
      firstName: "admin",
      lastName: "0",
      password: hashedPass,
      roll: "ADMIN",
      phoneNumber: "0900000000",
    });
    console.log("Default admin created");
  }
  console.log("Default admin was already created:)");
}
// 09155116587
// 0900000000
