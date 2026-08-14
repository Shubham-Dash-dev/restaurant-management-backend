const express = require("express");
const userRoutes = require("./modules/users/user.routes");
const authRoutes = require("./modules/auth/auth.routes");
const categoryRoutes = require('./modules/categories/category.routes');
const menuRoutes = require('./modules/menu/menu.routes')
const { sendError } = require("./utils/responseHandler");


const app = express();

// Middlewares
app.use(express.json());


// API Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/menu",menuRoutes);

// if no route found then it will hit this route 
app.all('/{*splat}', (req, res) => {
    return sendError(res,404, "Route not found");
})

module.exports = app;
