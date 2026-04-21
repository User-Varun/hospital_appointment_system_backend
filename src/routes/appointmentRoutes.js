const express = require("express");
const {
  bookAppointment,
  cancelAppointment,
  getAppointments,
  requestCancellation,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getAppointments);
router.post("/", protect, bookAppointment);
router.patch("/:id/cancel", protect, cancelAppointment);
router.patch("/:id/request-cancel", protect, requestCancellation);
router.patch("/:id/cancel-request", protect, requestCancellation);
router.patch("/:id/request-cancellation", protect, requestCancellation);
router.post("/:id/request-cancel", protect, requestCancellation);
router.patch("/:id/status", protect, updateAppointmentStatus);

module.exports = router;
