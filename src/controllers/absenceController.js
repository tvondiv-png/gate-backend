const Absence = require("../models/Absence");
const User = require("../models/User");
const Notification = require("../models/Notification");
const logAction = require("../utils/logAction");

function calcularDias(inicio, fim) {
  const diff = new Date(fim) - new Date(inicio);
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

const requestAbsence = async (req, res) => {
  const { dataInicio, dataFim, motivo } = req.body;

  if (!dataInicio || !dataFim || !motivo) {
    return res.status(400).json({ message: "Dados obrigatórios ausentes" });
  }

  const user = await User.findById(req.user.id);
  const dias = calcularDias(dataInicio, dataFim);

  const absence = await Absence.create({
    policial: user._id,
    policialSnapshot: {
      funcional: user.funcional,
      nome: user.nome,
      patente: user.patente
    },
    motivo,
    dataInicio,
    dataFim,
    dias
  });

  await logAction({
    action: "SOLICITAÇÃO DE AUSÊNCIA",
    performedBy: user._id,
    details: `${dias} dias`
  });

  res.json(absence);
};

const listAll = async (req, res) => {
  const list = await Absence.find().sort({ createdAt: -1 });
  res.json(list);
};

const approve = async (req, res) => {
  const absence = await Absence.findById(req.params.id);
  if (!absence) return res.status(404).json({ message: "Não encontrada" });

  absence.status = "Aprovada";
  absence.aprovadoPor = req.user.id;
  await absence.save();

  await User.findByIdAndUpdate(absence.policial, { status: "Ausente" });

  await require("../models/Hierarchy").findOneAndUpdate(
    { funcional: absence.policialSnapshot.funcional },
    { status: "Ausente" }
  );

  res.json(absence);
};

const reject = async (req, res) => {
  const { comentario } = req.body;
  if (!comentario) {
    return res.status(400).json({ message: "Comentário é obrigatório" });
  }

  const absence = await Absence.findById(req.params.id);
  if (!absence) return res.status(404).json({ message: "Não encontrada" });

  absence.status = "Rejeitada";
  absence.comentarioAdmin = comentario;
  await absence.save();

  await Notification.create({
    user: absence.policial,
    mensagem: `Solicitação de ausência rejeitada: ${comentario}`
  });

  res.json(absence);
};

const remove = async (req, res) => {
  await Absence.findByIdAndDelete(req.params.id);
  res.json({ message: "Ausência excluída" });
};

module.exports = {
  requestAbsence,
  listAll,
  approve,
  reject,
  delete: remove
};
