import mongoose from "../../config/db.js";
const personalSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  birthday: { type: Date },
  roll: { type: String, enum: ["NURSE", "ADMIN"] },
  patientsCount: { type: Number, default: 0 },
});
personalSchema.pre("save", function (next) {
  if (this.roll !== "NURSE") {
    this.patientsCount = undefined;
  }
  next();
});
const personalModel = mongoose.model("personal", personalSchema);
export default personalModel;
