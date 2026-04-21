const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");

exports.bookAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "patientId, doctorId and appointmentDate are required",
      });
    }

    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      User.findById(doctorId),
    ]);

    if (!patient || patient.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "invalid patientId",
      });
    }

    if (!doctor || doctor.role !== "doctor") {
      return res.status(400).json({
        success: false,
        message: "invalid doctorId",
      });
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate,
      reason,
    });

    return res.status(201).json({
      success: true,
      message: "appointment booked",
      data: appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "doctor already has an appointment at this time",
      });
    }

    return res.status(500).json({
      success: false,
      message: "failed to book appointment",
      error: error.message,
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "appointment not found",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "appointment cancelled",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to cancel appointment",
      error: error.message,
    });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query;

    const query = {};
    if (patientId) {
      query.patient = patientId;
    }
    if (doctorId) {
      query.doctor = doctorId;
    }
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "name username role")
      .populate("doctor", "name username role specialty")
      .sort({ appointmentDate: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to fetch appointments",
      error: error.message,
    });
  }
};
