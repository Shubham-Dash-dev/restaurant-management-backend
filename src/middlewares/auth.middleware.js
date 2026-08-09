const { verifyAccessToken } = require("../utils/jwt.util");
const userRepository = require("../modules/users/user.repository");
const { sendError } = require("../utils/responseHandler");

// 1. Protect Middleware: Verifies JWT Access Token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token is in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, 401, "You are not logged in. Please log in to get access.");
    }

    // Verify Access Token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return sendError(res, 401, "Invalid or expired access token");
    }

    // Check if user still exists in DB
    const currentUser = await userRepository.findUserById(decoded.id);
    if (!currentUser) {
      return sendError(res, 401, "The user belonging to this token no longer exists.");
    }

    // Check if user account is active
    if (!currentUser.isActive) {
      return sendError(res, 401, "Your account has been deactivated.");
    }

    // Attach user to req object for downstream controllers
    req.user = currentUser;
    next();
  } catch (error) {
    return sendError(res, 500, "Authentication failed", error.message);
  }
};

// 2. RestrictTo Middleware: Role-Based Authorization
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // console.log(req.user.role);
    // console.log(roles);
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        "Forbidden: You do not have permission to perform this action"
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
