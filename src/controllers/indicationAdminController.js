const Indication = require("../models/Indication");
const Notification = require("../models/Notification");
const logAction = require("../utils/logAction");

// 👑 Admin – listar todas
exports.listAll = async (req, res) => {
  const indications = await Indication.find()
    .populate("criadoPor", "nome email")
    .sort({ createdAt: -1 });

  res.json(indications);
};

// 👑 Admin – aprovar
exports.approve = async (req, res) => {
  const { id } = req.params;

  const indication = await Indication.findById(id);
  if (!indication) {
    return res.status(404).json({ message: "Indicação não encontrada" });
  }

  indication.status = "Aprovado";
  indication.comentarioAdmin = "";
  await indication.save();

  await logAction({
    usuario: req.user.id,
    acao: "APROVAÇÃO DE INDICAÇÃO",
    modulo: "INDICAÇÃO",
    alvoId: indication._id
  });

  res.json({ message: "Indicação aprovada" });
};

// 👑 Admin – rejeitar
exports.reject = async (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;

  if (!comentario) {
    return res.status(400).json({
      message: "Comentário é obrigatório para rejeição"
    });
  }

  const indication = await Indication.findById(id);
  if (!indication) {
    return res.status(404).json({ message: "Indicação não encontrada" });
  }

  indication.status = "Rejeitado";
  indication.comentarioAdmin = comentario;
  await indication.save();

  // 🔔 notificação ao usuário
  await Notification.create({
    usuario: indication.criadoPor,
    titulo: "Indicação rejeitada",
    mensagem: comentario,
    tipo: "indication"
  });

  await logAction({
    usuario: req.user.id,
    acao: "REJEIÇÃO DE INDICAÇÃO",
    modulo: "INDICAÇÃO",
    alvoId: indication._id,
    detalhes: comentario
  });

  res.json({ message: "Indicação rejeitada" });
};
