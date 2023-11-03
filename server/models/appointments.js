const mongoose = require("mongoose");

const DateDataSchema = new mongoose.Schema({
  meetDate: { type: Number, required: true },
  isOnline: { type: Boolean, required: true },
});

const DateData = mongoose.model("DateData", DateDataSchema);

const AnswerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  dates: [DateDataSchema],
});

const Answer = mongoose.model("Answer", AnswerSchema);

const DayTimesSchema = new mongoose.Schema({
  date: { type: Number, required: true },
  times: { type: [Number], required: true },
});

const DayTimes = mongoose.model("DayTimes", DayTimesSchema);

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true },
  meetName: { type: String, required: true },
  dates: [DayTimesSchema],
  answers: [AnswerSchema],
});

const Appointment = mongoose.model("Appointment", AppointmentSchema);

module.exports = { Appointment, Answer, DateData, DayTimes };
