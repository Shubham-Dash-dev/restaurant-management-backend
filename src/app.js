const express = require("express");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./modules/users/user.routes");
const authRoutes = require("./modules/auth/auth.routes");
const categoryRoutes = require('./modules/categories/category.routes');
const menuRoutes = require('./modules/menu/menu.routes')
const cartRoutes = require('./modules/cart/cart.routes');
const { orderRoutes, staffOrderRoutes, adminOrderRoutes } = require("./modules/orders/order.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");
const favoriteRoutes = require("./modules/favorites/favorite.routes");
const { sendError } = require("./utils/responseHandler");


const app = express();

// Middlewares
app.use(express.json({limit:"10kb"}));
app.use(express.urlencoded({extended:true,limit:"10kb"}));

// Global Rate Limiter (Max 1000 requests per hour per IP)
const globalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: "Too many requests from this IP, please try again after an hour.",
});
app.use("/api", globalLimiter);

// API Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/menu",menuRoutes);
app.use("/api/v1/cart",cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/staff/orders", staffOrderRoutes);
app.use("/api/v1/admin/orders", adminOrderRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/favorites", favoriteRoutes);

// if no route found then it will hit this route 
app.all('/{*splat}', (req, res) => {
    return sendError(res,404, "Route not found");
})

module.exports = app;
