const DisciplinaryCase = require("../models/DisciplinaryCase");
const logAction = require("../utils/logAction");

// LISTAR
exports.listCases = async (req, res) => {
  const cases = await DisciplinaryCase.find()
    .populate("policial", "nome funcional patente")
    .sort({ createdAt: -1 });

  res.json(cases);
};

// CRIAR (IPM)
exports.createCase = async (req, res) => {
  const { policialId, tipo, descricao } = req.body;

  const anoAtual = new Date().getFullYear();

  const totalAno = await DisciplinaryCase.countDocuments({ ano: anoAtual });
  const sequencial = String(totalAno + 1).padStart(3, "0");

  const numero = `IMP-${sequencial}/${anoAtual}`;

  const novoCaso = await DisciplinaryCase.create({
    numero,
    ano: anoAtual,
    policial: policialId,
    tipo,
    descricao,
    criadoPor: req.user.id
  });

  res.json(novoCaso);
};


// COMENTÁRIO
exports.addComentario = async (req, res) => {
  const caso = await DisciplinaryCase.findById(req.params.id);
  caso.comentarios.push({
    texto: req.body.texto,
    autor: req.user.id
  });
  await caso.save();
  res.json(caso);
};

// CONVOCAÇÃO
exports.convocar = async (req, res) => {
  const caso = await DisciplinaryCase.findById(req.params.id);
  caso.convocacoes.push({ mensagem: req.body.mensagem });
  caso.status = "Em Análise";
  await caso.save();
  res.json(caso);
};

// CONCLUSÃO
exports.concluir = async (req, res) => {
  const caso = await DisciplinaryCase.findById(req.params.id);

  caso.conclusao = {
    texto: req.body.conclusao,
    sancoes: req.body.sancoes,
    data: new Date()
  };

  caso.status = "Encerrado";
  await caso.save();
  res.json(caso);
};

exports.excluirCaso = async (req, res) => {
  const caso = await DisciplinaryCase.findById(req.params.id);

  if (!caso) {
    return res.status(404).json({ message: "Processo não encontrado" });
  }

  await caso.deleteOne();

  await logAction({
    action: "EXCLUSÃO DE PROCESSO DISCIPLINAR",
    performedBy: req.user.id,
    targetUser: caso.policial,
    details: "Processo removido por erro administrativo"
  });

  res.json({ message: "Processo excluído com sucesso" });
};
