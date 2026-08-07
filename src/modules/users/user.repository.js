const AppDataSource = require("../../database/data-source");
const User = require("./user.entity");

const userRepository = AppDataSource.getRepository(User);

const findUserByEmail = async (email) => {
  return await userRepository.findOne({ where: { email } });
};

const findUserById = async (id) => {
  return await userRepository.findOne({ where: { id } });
};

const findUserByPhoneNumber = async (phone) => {
  return await userRepository.findOne({ where: { phone } });
};

const createNewUser = async (userData) => {
  const newUser = userRepository.create(userData);
  return await userRepository.save(newUser);
};

// Get all users with filters, search, sort & pagination
const findAllUsers = async ({ page = 1, limit = 10, role, search, sort }) => {
  const skip = (page - 1) * limit;

  // create query builder is an built in typeorm method 
  // calling .createQueryBuilder("user") tells TypeORM: "Start building a SQL SELECT query on the users table and call the table alias user."
  const queryBuilder = userRepository.createQueryBuilder("user")
    .where("user.deletedAt IS NULL");


  // 1. filter by role 
  if (role) {
    queryBuilder.andWhere("user.role = :role", { role });
  }

  // 2. search by name or email
  if (search) {
    queryBuilder.andWhere(
      "(user.fullName ILIKE :search OR user.email ILIKE :search)",
      { search: `%${search}%` }
    );
  }

  // 3. Sorting (e.g. sort=createdAt or sort=-createdAt)
  if (sort) {
    const isDesc = sort.startsWith("-");
    // if sort is starting with '-' then we have to start our string from createdAt 
    // lets understand if string of sort is -createdAt then '-' = 0 index , 'c' = 1 index and so on 
    // what we are doing here is substring(1) means start our string from first index and go till end and ignore the 0th index '-' 
    const sortField = isDesc ? sort.substring(1) : sort;
    queryBuilder.orderBy(`user.${sortField}`, isDesc ? "DESC" : "ASC");
  } else {
    queryBuilder.orderBy("user.createdAt", "DESC");
  }


// Normally in SQL, to build pagination, you have to run TWO separate SQL queries:
// Query 1: SELECT * FROM users LIMIT 10 OFFSET 0 (Gets the 10 users for this page).
// Query 2: SELECT COUNT(*) FROM users (Gets total count of users in database).
// TypeORM's .getManyAndCount() runs both queries together and returns a 2-element array:
//  [users, totalCount]  <-- users = Array of user objects fetched for current page
//                       <-- totalCount = Number of total users in database(without limit/skip)
// 4. Pagination (skip & limit)
  return await queryBuilder
    .skip(skip)
    .take(limit)
    .getManyAndCount();
};

const updateUserById = async (id, updateData) => {
  await userRepository.update(id, updateData);
  return await findUserById(id);
};

const softDeleteUserById = async (id) => {
  await userRepository.update(id, { isActive: false });
  return await userRepository.softDelete(id);
};


module.exports = {
  findUserByEmail,
  createNewUser,
  findUserByPhoneNumber,
  findUserById,
  findAllUsers,
  updateUserById,
  softDeleteUserById,
};
