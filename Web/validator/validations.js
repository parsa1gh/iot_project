import Joi from "joi";

export const nurseRegisterSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(6).required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  birthday: Joi.date().max("now").required(),
});
export const nurseUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(6),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  birthday: Joi.date().max("now").required(),
});
export const nurseLoginSchema = Joi.object({
  identifier: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  password: Joi.string().min(6).required(),
  remember: Joi.boolean(),
});

export const patientValidatorSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(6).required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  birthday: Joi.date().max("now").required(),
  rfId: Joi.string().allow(null, "").optional(),
  ble: Joi.string().allow(null, "").optional(),
  fr: Joi.string().allow(null, "").optional(),
});
export const patientLoginSchema = Joi.object({
  password: Joi.string().min(6).required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  rfId: Joi.string().allow(null, "").optional(),
  blu: Joi.string().allow(null, "").optional(),
  fr: Joi.string().allow(null, "").optional(),
});

export const adminLoginSchema = Joi.object({
  identifier: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  password: Joi.string().min(6).required(),
  remember: Joi.boolean(),
});
