const userService = require("./user.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");

module.exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return sendSuccess(res, 201, "User created successfully", user);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);
    return sendSuccess(res, 200, "Users fetched successfully", result);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

module.exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, 200, "User fetched successfully", user);
  } catch (error) {
    return sendError(res, 404, error.message, error);
  }
};

module.exports.updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, 200, "User updated successfully", updatedUser);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};

module.exports.deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return sendSuccess(res, 200, "User deleted successfully");
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};
