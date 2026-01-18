const IPM = require("../models/IPM");
const Notification = require("../models/Notification");
const logAction = require("../utils/logAction");
const generateIPMNumber = require("../utils/generateIPMNumber");

// LISTAGEM INTERNA (SIGILOSA)
exports.list = async (req, res) => {
  const ipms = await IPM.find()
    .populate("criadoPor", "nome funcional patente")
    .sort({ createdAt: -1 });

  res.json(ipms);
};

// ABRIR IPM (SEM NOTIFICAR O POLICIAL)
exports.create = async (req, res) => {
  const { policialId, descricaoInicial } = req.body;

  const { numero, ano, sequencial } = await generateIPMNumber();

  const policial = await require("../models/User").findById(policialId);

  const ipm = await IPM.create({
    numero,
    ano,
    sequencial,
    policial: policial._id,
    policialSnapshot: {
      funcional: policial.funcional,
      nome: policial.nome,
      patente: policial.patente
    },
    descricaoInicial,
    criadoPor: req.user.id
  });

  await logAction({
    action: "ABERTURA DE IPM (SIGILOSO)",
    performedBy: req.user.id,
    targetUser: policial._id,
    details: numero
  });

  res.json(ipm);
};

// COMENTÁRIO INTERNO
exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { texto } = req.body;

  const ipm = await IPM.findById(id);
  if (!ipm) return res.status(404).json({ message: "IPM não encontrado" });

  ipm.comentariosInternos.push({
    autor: req.user.id,
    texto
  });

  await ipm.save();

  await logAction({
    action: "COMENTÁRIO INTERNO EM IPM",
    performedBy: req.user.id,
    details: ipm.numero
  });

  res.json(ipm);
};

// CONVOCAR POLICIAL (NOTIFICA)
exports.convocar = async (req, res) => {
  const { id } = req.params;
  const { mensagem } = req.body;

  const ipm = await IPM.findById(id);

  await Notification.create({
    user: ipm.policial,
    mensagem
  });

  await logAction({
    action: "CONVOCAÇÃO EM IPM",
    performedBy: req.user.id,
    targetUser: ipm.policial,
    details: ipm.numero
  });

  res.json({ message: "Convocação enviada" });
};

// CONCLUIR IPM (NOTIFICA SE HOUVER SANÇÃO)
exports.concluir = async (req, res) => {
  const { id } = req.params;
  const { conclusao, sancoes } = req.body;

  const ipm = await IPM.findById(id);
  ipm.status = "Concluído";
  ipm.boletimConclusao = {
    conclusao,
    sancoes,
    data: new Date()
  };

  await ipm.save();

  if (sancoes) {
    await Notification.create({
      user: ipm.policial,
      mensagem: "Você possui comunicação oficial do Setor de Justiça & Disciplina."
    });
  }

  await logAction({
    action: "CONCLUSÃO DE IPM",
    performedBy: req.user.id,
    targetUser: ipm.policial,
    details: ipm.numero
  });

  res.json(ipm);
};
// EXCLUIR IPM (somente erro administrativo)
exports.delete = async (req, res) => {
  const { id } = req.params;

  const ipm = await IPM.findById(id);
  if (!ipm) {
    return res.status(404).json({ message: "IPM não encontrado" });
  }

  await IPM.findByIdAndDelete(id);

  await logAction({
    action: "EXCLUSÃO DE IPM",
    performedBy: req.user.id,
    targetUser: ipm.policial,
    details: ipm.numero
  });

  res.json({ message: "IPM excluído com sucesso" });
};
