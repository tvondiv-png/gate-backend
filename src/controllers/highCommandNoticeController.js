const HighCommandNotice = require("../models/HighCommandNotice");
const User = require("../models/User");

function noticeMatchesUser(notice, user) {
  if (!notice?.ativo) return false;

  if (notice.tipoDestino === "todos") return true;

  if (notice.tipoDestino === "funcao") {
    return notice.funcao && notice.funcao === user.funcao;
  }

  if (notice.tipoDestino === "patente") {
    return notice.patente && notice.patente === user.patente;
  }

  if (notice.tipoDestino === "funcionais") {
    return Array.isArray(notice.funcionais) && notice.funcionais.includes(Number(user.funcional));
  }

  return false;
}

exports.createNotice = async (req, res) => {
  try {
    const { titulo, mensagem, tipoDestino, funcao, patente, funcionais } = req.body;

    if (!titulo || !mensagem) {
      return res.status(400).json({ message: "Título e mensagem são obrigatórios" });
    }

    if (tipoDestino === "funcao" && !funcao) {
      return res.status(400).json({ message: "Informe a função de destino" });
    }

    if (tipoDestino === "patente" && !patente) {
      return res.status(400).json({ message: "Informe a patente de destino" });
    }

    if (tipoDestino === "funcionais" && (!Array.isArray(funcionais) || !funcionais.length)) {
      return res.status(400).json({ message: "Informe os funcionais de destino" });
    }

    const item = await HighCommandNotice.create({
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      tipoDestino: tipoDestino || "todos",
      funcao: funcao || "",
      patente: patente || "",
      funcionais: Array.isArray(funcionais) ? funcionais.map(Number) : [],
      criadoPor: {
        userId: req.user._id,
        nome: req.user.nome || ""
      }
    });

    return res.status(201).json({
      message: "Comunicado do Alto Comando criado com sucesso",
      item
    });
  } catch (err) {
    console.error("Erro ao criar comunicado:", err);
    return res.status(500).json({ message: "Erro ao criar comunicado" });
  }
};

exports.listAllNotices = async (req, res) => {
  try {
    const items = await HighCommandNotice.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json(items);
  } catch (err) {
    console.error("Erro ao listar comunicados:", err);
    return res.status(500).json({ message: "Erro ao listar comunicados" });
  }
};

exports.getActiveNoticeForUser = async (req, res) => {
  try {
    const notices = await HighCommandNotice.find({ ativo: true })
      .sort({ createdAt: -1 });

    const user = req.user;

    const item = notices.find((notice) => {
      if (!noticeMatchesUser(notice, user)) return false;

      const jaRespondeu = (notice.respostas || []).some(
        (r) => String(r.user) === String(user._id)
      );

      return !jaRespondeu;
    });

    return res.json(item || null);
  } catch (err) {
    console.error("Erro ao buscar comunicado ativo:", err);
    return res.status(500).json({ message: "Erro ao buscar comunicado ativo" });
  }
};

exports.respondNotice = async (req, res) => {
  try {
    const { decisao } = req.body;
    const { id } = req.params;

    if (!["MANTER", "APAGAR"].includes(decisao)) {
      return res.status(400).json({ message: "Decisão inválida" });
    }

    const item = await HighCommandNotice.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Comunicado não encontrado" });
    }

    const jaRespondeu = (item.respostas || []).some(
      (r) => String(r.user) === String(req.user._id)
    );

    if (jaRespondeu) {
      return res.status(400).json({ message: "Você já respondeu este comunicado" });
    }

    item.respostas.push({
      user: req.user._id,
      funcional: Number(req.user.funcional),
      decisao,
      dataResposta: new Date()
    });

    await item.save();

    return res.json({ message: "Resposta registrada com sucesso" });
  } catch (err) {
    console.error("Erro ao responder comunicado:", err);
    return res.status(500).json({ message: "Erro ao responder comunicado" });
  }
};

exports.deactivateNotice = async (req, res) => {
  try {
    const item = await HighCommandNotice.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Comunicado não encontrado" });
    }

    item.ativo = false;
    await item.save();

    return res.json({ message: "Comunicado encerrado com sucesso" });
  } catch (err) {
    console.error("Erro ao encerrar comunicado:", err);
    return res.status(500).json({ message: "Erro ao encerrar comunicado" });
  }
};