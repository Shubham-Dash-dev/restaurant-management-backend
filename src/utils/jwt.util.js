const jwt = require("jsonwebtoken");
const env = require("../config/env");

// generate short-lived access token (15m)
const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

// generate long-lived refresh token (7d)
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
};

// verify access token
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

// verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
