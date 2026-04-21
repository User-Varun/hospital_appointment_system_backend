const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
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

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        specialty: user.specialty,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to register user",
      error: error.message,
    });
  }
};

exports.authenticateUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username and password are required",
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "invalid credentials",
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      success: true,
      message: "authenticated",
      token,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to authenticate user",
      error: error.message,
    });
  }
};

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
