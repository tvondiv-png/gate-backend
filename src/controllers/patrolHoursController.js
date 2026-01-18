const PatrolHours = require("../models/PatrolHours");

exports.listAll = async (req, res) => {
  const horas = await PatrolHours.find().sort({ horasMensais: -1 });
  res.json(horas);
};

exports.resetWeekly = async (req, res) => {
  await PatrolHours.updateMany({}, { horasSemanais: 0 });
  res.json({ message: "Horas semanais zeradas" });
};

exports.resetMonthly = async (req, res) => {
  await PatrolHours.updateMany({}, { horasMensais: 0 });
  res.json({ message: "Horas mensais zeradas" });
};
