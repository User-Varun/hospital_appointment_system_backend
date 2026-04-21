const express = require("express");
const cors = require("cors");
const userRouter = require("./routes/userRoutes");
const appointmentRouter = require("./routes/appointmentRoutes");

const app = express();

app.use(cors());
app.use(express.json()); // json body parser

app.use("/api/v1/users", userRouter);
app.use("/api/v1/appointments", appointmentRouter);

module.exports = app;
