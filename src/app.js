const express = require("express");

const app = express();

// Middlewares
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Restaurant Management API is running..."
    });
});

module.exports = app;