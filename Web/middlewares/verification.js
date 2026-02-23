export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req.body);
      next();
    } catch (error) {
      let errorObj = {};
      errorObj[error.details[0].path[0]] = error.details[0].message;
      res.status(400).json({ error: errorObj });
    }
  };
};
