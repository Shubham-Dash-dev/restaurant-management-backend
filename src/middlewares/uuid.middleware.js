const { sendError } = require("../utils/responseHandler");

// Validates that :id in req.params is a valid UUID format
const validateUUID = (req, res, next) => {
  const { id } = req.params;

  // Regular expression for standard UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // Test if "id" matches the UUID pattern
  if (id && !uuidRegex.test(id)) {
    return sendError(res, 400, "Invalid ID format. Must be a valid UUID.");
  }
  
  // If valid, move to the next middleware/controller
  next();
};

module.exports = validateUUID;
