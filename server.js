const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./src/app");

dotenv.config({ path: "./config.env" });

const PORT = process.env.PORT || 5000;
const mongoUriTemplate = process.env.MONGO_URI_TEMPLATE || "";
const mongoDbPassword = process.env.MONGO_DB_PASSWORD || "";

const MONGO_URI = mongoUriTemplate
  ? mongoUriTemplate.replace("<PASSWORD>", mongoDbPassword)
  : "mongodb://127.0.0.1:27017/hospital_appointment_system";

const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

connectDatabase();
