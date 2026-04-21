const express = require("express");
const {
  signupUser,
  loginUser,
  getAllUsers,
  getPatients,
  getDoctors,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getAllUsers);
router.post("/signup", signupUser);
router.post("/register", signupUser);
router.post("/login", loginUser);
router.post("/authenticate", loginUser);
router.get("/patients", protect, getPatients);
router.get("/doctors", protect, getDoctors);

module.exports = router;
