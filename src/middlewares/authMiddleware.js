const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "authorization token is required",
      });
    }

    const token = authorization.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET || "dev-secret";

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "invalid or expired token",
    });
  }
};
