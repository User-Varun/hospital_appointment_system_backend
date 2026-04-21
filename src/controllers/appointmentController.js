const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");

exports.bookAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    if (!["doctor", "patient"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "only doctors and patients can create appointments",
      });
    }

    if (!doctorId || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "doctorId and appointmentDate are required",
      });
    }

    const effectivePatientId =
      req.user.role === "patient" ? req.user.id : patientId;

    if (req.user.role === "doctor" && !effectivePatientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required when doctor books an appointment",
      });
    }

    if (req.user.role === "doctor" && doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "doctors can only book appointments for themselves",
      });
    }

    const [patient, doctor] = await Promise.all([
      User.findById(effectivePatientId),
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
      status: req.user.role === "patient" ? "appointment_requested" : "booked",
    });

    return res.status(201).json({
      success: true,
      message:
        req.user.role === "patient"
          ? "appointment request submitted"
          : "appointment booked",
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
    if (req.user?.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "only doctors can cancel appointments",
      });
    }

    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "appointment not found",
      });
    }

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "you can only cancel your own appointments",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "appointment is already cancelled",
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

exports.requestCancellation = async (req, res) => {
  try {
    if (req.user?.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "only patients can request cancellation",
      });
    }

    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "appointment not found",
      });
    }

    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "you can only request cancellation for your own appointments",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "appointment is already cancelled",
      });
    }

    if (appointment.status === "cancellation_requested") {
      return res.status(400).json({
        success: false,
        message: "cancellation has already been requested",
      });
    }

    appointment.status = "cancellation_requested";
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "cancellation requested",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to request cancellation",
      error: error.message,
    });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    const query = {};
    if (req.user?.role === "patient") {
      query.patient = req.user.id;
      if (doctorId) {
        query.doctor = doctorId;
      }
    } else if (req.user?.role === "doctor") {
      query.doctor = req.user.id;
    } else {
      return res.status(403).json({
        success: false,
        message: "only patients and doctors can view appointments",
      });
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

exports.updateAppointmentStatus = async (req, res) => {
  try {
    if (req.user?.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "only doctors can update appointment status",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["booked", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be booked or cancelled",
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "appointment not found",
      });
    }

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "you can only update your own appointments",
      });
    }

    const canUpdateFromRequested =
      appointment.status === "appointment_requested" &&
      ["booked", "cancelled"].includes(status);

    const canUpdateFromCancellationRequest =
      appointment.status === "cancellation_requested" &&
      ["booked", "cancelled"].includes(status);

    const canUpdateFromBooked =
      appointment.status === "booked" && status === "cancelled";

    if (
      !canUpdateFromRequested &&
      !canUpdateFromCancellationRequest &&
      !canUpdateFromBooked
    ) {
      return res.status(400).json({
        success: false,
        message: "status update is not allowed for current appointment state",
      });
    }

    appointment.status = status;
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "appointment status updated",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to update appointment status",
      error: error.message,
    });
  }
};
