const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const buildAuthResponse = (user, token) => ({
  success: true,
  token,
  data: {
    _id: user._id,
    name: user.name,
    username: user.username,
    role: user.role,
    specialty: user.specialty,
  },
});

const createToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "1d" },
  );
};

const signupUser = async (req, res) => {
  try {
    const { name, username, password, role, specialty } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "name, username, password and role are required",
      });
    }

    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "role must be either patient or doctor",
      });
    }

    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "username already exists",
      });
    }

    const user = await User.create({
      name,
      username,
      password,
      role,
      specialty,
    });

    const token = createToken(user);

    return res.status(201).json(buildAuthResponse(user, token));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to sign up user",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username and password are required",
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    const isPasswordValid = user ? await user.matchPassword(password) : false;
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "invalid credentials",
      });
    }

    const token = createToken(user);
    return res.status(200).json(buildAuthResponse(user, token));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to login user",
      error: error.message,
    });
  }
};

exports.signupUser = signupUser;
exports.loginUser = loginUser;
exports.registerUser = signupUser;
exports.authenticateUser = loginUser;

exports.getAllUsers = async (_req, res) => {
  try {
    const users = await User.find({}, "-password");
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to fetch users",
      error: error.message,
    });
  }
};

exports.getPatients = async (_req, res) => {
  try {
    const patients = await User.find({ role: "patient" }, "-password");
    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to fetch patients",
      error: error.message,
    });
  }
};

exports.getDoctors = async (_req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }, "-password");
    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to fetch doctors",
      error: error.message,
    });
  }
};
