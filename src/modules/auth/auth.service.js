const userRepository = require("../users/user.repository");
const bcrypt = require('bcrypt');
const env = require('../../config/env');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../../utils/jwt.util');

module.exports.register = async (userData) => {
  const existingEmail = await userRepository.findUserByEmail(userData.email);
  if (existingEmail) throw new Error("Email already exists");

  if (userData.phone) {
    const existingPhone = await userRepository.findUserByPhoneNumber(userData.phone);
    if (existingPhone) throw new Error("Phone number already exists");
  }

  const hashedPassword = await bcrypt.hash(userData.password, Number(env.salt));
  const newUser = await userRepository.createNewUser({
    ...userData,
    password: hashedPassword,
    role: "CUSTOMER",
  })

  // Generate tokens
  const payload = { id: newUser.id, role: newUser.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Update user with refresh token // save refresh token in database
  await userRepository.updateUserById(newUser.id, { refreshToken });

  const { password, refreshToken: token, ...sanitizedUser } = newUser;

  return { sanitizedUser, accessToken, refreshToken };

}

module.exports.login = async (userData) => {
  const user = await userRepository.findUserByEmail(userData.email);
  if (!user) {
    throw new Error("Invalid email or password"); // we intentionally throw same error in both case  . so hacker not able to know whether it is email or password went wrong. this is for security reason 
  }
  if (!user.isActive) {
    throw new Error("Your account has been deactivated. Please contact support.");
  }
  const isPasswordMatch = await bcrypt.compare(userData.password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid email or password"); // we intentionally throw same error in both case  . so hacker not able to know whether it is email or password went wrong. this is for security reason 
  }
  const payload = { id: user.id, role: user.role };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await userRepository.updateUserById(user.id, { refreshToken });

  const { password, refreshToken: token, ...sanitizedUser } = user;

  return { sanitizedUser, accessToken, refreshToken };

}

// 3. Generate new Access Token using Refresh Token
module.exports.refreshToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
  const user = await userRepository.findUserById(decoded.id);
  if (!user || user.refreshToken !== token || !user.isActive) {
    throw new Error("Invalid refresh token session");
  }
  // Generate new short-lived access token
  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  return { accessToken };
};

// 4. Logout User (Invalidate refresh token in DB)
module.exports.logout = async (userId) => {
  return await userRepository.updateUserById(userId, { refreshToken: null });
};


// 5. Get Logged-in User Profile
module.exports.getProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new Error("User not found");
  const { password, refreshToken, ...sanitizedUser } = user;
  return sanitizedUser;
};


// 6. Update Logged-in User Profile (fullName, phone)
module.exports.updateProfile = async (userId, { fullName, phone }) => {
  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (phone) {
    const existingPhone = await userRepository.findUserByPhoneNumber(phone);
    if (existingPhone && existingPhone.id !== userId) {
      throw new Error("Phone number is already in use by another account");
    }
    updateData.phone = phone;
  }
  const updatedUser = await userRepository.updateUserById(userId, updateData);
  const { password, refreshToken, ...sanitizedUser } = updatedUser;
  return sanitizedUser;
};


// 7. Change Password
module.exports.changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new Error("User not found");
  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }
  // Hash new password
  const saltRounds = Number(env.salt) || 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  // Invalidate old refresh token session on password change
  await userRepository.updateUserById(userId, {
    password: hashedPassword,
    refreshToken: null,
  });
  return true;
};