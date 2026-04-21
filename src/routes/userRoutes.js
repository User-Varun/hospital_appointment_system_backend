const express = require("express");
const {
  registerUser,
  authenticateUser,
  getAllUsers,
  getPatients,
  getDoctors,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getAllUsers);
router.post("/register", registerUser);
router.post("/authenticate", authenticateUser);
router.get("/patients", protect, getPatients);
router.get("/doctors", protect, getDoctors);

module.exports = router;
