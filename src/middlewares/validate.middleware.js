const { validationResult } = require("express-validator");
const { sendError } = require("../utils/responseHandler");

const validate = (req, res, next) => {
 // validationResult(req) extracts the error list that createUserValidation attached to req
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,  // e.g. "email"
      message: err.msg, // // e.g. "Please enter a valid email address"
    }));
    
    return sendError(res, 400, "Validation Failed", formattedErrors);
  }
 
  next();
};

module.exports = validate;

