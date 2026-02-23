import mongoose from "../../config/db.js";
const patientSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: "personal" },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  birthday: { type: Date, required: true },
  rfId: { type: String, unique: true, sparse: true },
  ble: { type: String, unique: true, sparse: true },
  fr: { type: [Number], default: [], sparse: true },
});
const patientModel = mongoose.model("patient", patientSchema);
export default patientModel;
