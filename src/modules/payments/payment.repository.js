const AppDataSource = require("../../database/data-source");
const Payment = require("./payment.entity");

const paymentRepository = AppDataSource.getRepository(Payment);

// 1. Create a payment record
const createPayment = async (paymentData) => {
  const payment = paymentRepository.create(paymentData);
  return await paymentRepository.save(payment);
};

// 2. Find payment by Order ID
const findPaymentByOrderId = async (orderId) => {
  return await paymentRepository.findOne({
    where: { orderId },
    relations: ["user", "order"],
  });
};

// 3. Find payment by Transaction ID
const findPaymentByTransactionId = async (transactionId) => {
  return await paymentRepository.findOne({
    where: { transactionId },
    relations: ["user", "order"],
  });
};

// 4. Admin query: Find all payments with filters & date range
const findAllPayments = async ({
  page = 1,
  limit = 10,
  paymentMethod,
  paymentStatus,
  startDate,
  endDate,
}) => {
  const skip = (page - 1) * limit;

  const queryBuilder = paymentRepository
    .createQueryBuilder("payment")
    .leftJoinAndSelect("payment.user", "user")
    .leftJoinAndSelect("payment.order", "order");

  if (paymentMethod) {
    queryBuilder.andWhere("payment.paymentMethod = :paymentMethod", { paymentMethod });
  }

  if (paymentStatus) {
    queryBuilder.andWhere("payment.paymentStatus = :paymentStatus", { paymentStatus });
  }

  if (startDate) {
    queryBuilder.andWhere("payment.createdAt >= :startDate", { startDate });
  }

  if (endDate) {
    queryBuilder.andWhere("payment.createdAt <= :endDate", { endDate });
  }

  queryBuilder.orderBy("payment.createdAt", "DESC").skip(skip).take(limit);

  return await queryBuilder.getManyAndCount();
};

// 5. Update payment status (e.g. to 'REFUNDED')
const updatePaymentStatus = async (paymentId, paymentStatus) => {
  await paymentRepository.update(paymentId, { paymentStatus });
  return await paymentRepository.findOne({ where: { id: paymentId } });
};

module.exports = {
  createPayment,
  findPaymentByOrderId,
  findPaymentByTransactionId,
  findAllPayments,
  updatePaymentStatus
};
