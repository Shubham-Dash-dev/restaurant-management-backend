const userRepository = require("./user.repository");
const bcrypt = require("bcrypt");

// create user
module.exports.createUser = async (userData) => {
  const email = await userRepository.findUserByEmail(userData.email);
  if (email) {
    throw new Error("User already exists with this email");
  }
  if (userData.phone) {
    const phone = await userRepository.findUserByPhoneNumber(userData.phone);
    if (phone) {
      throw new Error("User already exists with this phone number");
    }
  }
  
  const salt = process.env.SALT || 10;
  const hashedPassword = await bcrypt.hash(userData.password, Number(salt));
  const newUser = await userRepository.createNewUser({
    ...userData,
    password: hashedPassword,
  });

  const { password, refreshToken, ...sanitizedUser } = newUser;
  return sanitizedUser;
};

// get all users 
module.exports.getAllUsers = async (queryParams) => {
  console.log(queryParams);
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  console.log({page,limit});
  const [users, total] = await userRepository.findAllUsers(queryParams);


  const sanitizedUsers = users.map(({ password, refreshToken, ...rest }) => rest);


  return {
    users: sanitizedUsers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
// get all users 
module.exports.getAllUsers = async (queryParams) => {
  // Clean query object keys (strips accidental trailing spaces)
  const cleanQuery = {};
  Object.keys(queryParams).forEach((key) => {
    cleanQuery[key.trim()] = queryParams[key];
  });
  // console.log(cleanQuery)
  const page = Number(cleanQuery.page) || 1;
  const limit = Number(cleanQuery.limit) || 10;
  // console.log(page , limit);
  const [users, total] = await userRepository.findAllUsers({
    ...cleanQuery,
    page,
    limit,
  });

  const sanitizedUsers = users.map(({ password, refreshToken, ...rest }) => rest);

  return {
    users: sanitizedUsers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};



// get user by ID
module.exports.getUserById = async (id) => {
  const user = await userRepository.findUserById(id);
  if (!user) {
    throw new Error("User not found");
  }
  const { password, refreshToken, ...sanitizedUser } = user;
  return sanitizedUser;
};

// update user
module.exports.updateUser = async (id, updateData) => {
  const user = await userRepository.findUserById(id);
  if (!user) {
    throw new Error("User not found");
  }
  const updatedUser = await userRepository.updateUserById(id, updateData);
  const { password, refreshToken, ...sanitizedUser } = updatedUser;
  return sanitizedUser;
};

// delete user (soft delete)
module.exports.deleteUser = async (id) => {
  const user = await userRepository.findUserById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return await userRepository.softDeleteUserById(id);
};