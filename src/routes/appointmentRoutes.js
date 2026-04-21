const express = require("express");
const {
  bookAppointment,
  cancelAppointment,
  getAppointments,
} = require("../controllers/appointmentController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getAppointments);
router.post("/", protect, bookAppointment);
router.patch("/:id/cancel", protect, cancelAppointment);

module.exports = router;
