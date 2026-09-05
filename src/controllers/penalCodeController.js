const PenalCode = require("../models/PenalCode");

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBoolean(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

function parseStringArray(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  if (typeof value === "string") {
    return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
  }

  return [];
}

function buildPublicFilter(query = {}) {
  const {
    q = "",
    tipo = "",
    categoria = "",
    semFianca = "",
    comMulta = "",
    comPrisao = "",
    limit = "300"
  } = query;

  const filtro = { ativo: true };

  if (tipo && ["INFRACAO", "CRIME"].includes(tipo)) {
    filtro.tipo = tipo;
  }

  if (categoria) {
    filtro.categoria = categoria;
  }

  if (semFianca === "true") {
    filtro.semFianca = true;
  }

  if (comMulta === "true") {
    filtro.multa = { $gt: 0 };
  }

  if (comPrisao === "true") {
    filtro.prisaoMeses = { $gt: 0 };
  }

  if (q.trim()) {
    const termo = q.trim();
    const regex = new RegExp(escapeRegex(termo), "i");

    filtro.$or = [
      { artigo: regex },
      { codigo: regex },
      { titulo: regex },
      { descricao: regex },
      { categoria: regex },
      { palavrasChave: { $elemMatch: { $regex: regex } } }
    ];
  }

  return {
    filtro,
    limite: Math.min(Number(limit) || 300, 1000)
  };
}

function buildAdminFilter(query = {}) {
  const {
    q = "",
    tipo = "",
    categoria = "",
    ativo = "",
    destaque = "",
    semFianca = "",
    comMulta = "",
    comPrisao = "",
    limit = "500"
  } = query;

  const filtro = {};

  if (tipo && ["INFRACAO", "CRIME"].includes(tipo)) {
    filtro.tipo = tipo;
  }

  if (categoria) {
    filtro.categoria = categoria;
  }

  const ativoValue = parseBoolean(ativo);
  if (ativoValue !== undefined) {
    filtro.ativo = ativoValue;
  }

  const destaqueValue = parseBoolean(destaque);
  if (destaqueValue !== undefined) {
    filtro.destaque = destaqueValue;
  }

  if (semFianca === "true") {
    filtro.semFianca = true;
  }

  if (comMulta === "true") {
    filtro.multa = { $gt: 0 };
  }

  if (comPrisao === "true") {
    filtro.prisaoMeses = { $gt: 0 };
  }

  if (q.trim()) {
    const termo = q.trim();
    const regex = new RegExp(escapeRegex(termo), "i");

    filtro.$or = [
      { artigo: regex },
      { codigo: regex },
      { titulo: regex },
      { descricao: regex },
      { categoria: regex },
      { palavrasChave: { $elemMatch: { $regex: regex } } }
    ];
  }

  return {
    filtro,
    limite: Math.min(Number(limit) || 500, 1000)
  };
}

function appendHistory(doc, req, acao, observacao = "") {
  const user = req.user || {};

  doc.historico.push({
    acao,
    autorId: user.id || user._id || null,
    autorNome: user.nome || "",
    autorPatente: user.patente || "",
    observacao,
    data: new Date()
  });

  doc.atualizadoPor = user.id || user._id || null;
  doc.ultimaAtualizacaoDescricao = observacao || acao;
}

exports.listPenalCodes = async (req, res) => {
  try {
    const { filtro, limite } = buildPublicFilter(req.query);

    const itens = await PenalCode.find(filtro)
      .sort({ ordem: 1, codigo: 1, titulo: 1 })
      .limit(limite)
      .lean();

    return res.json(itens);
  } catch (err) {
    console.error("Erro ao listar código penal:", err);
    return res.status(500).json({ message: "Erro ao listar código penal" });
  }
};

exports.getPenalCodeById = async (req, res) => {
  try {
    const item = await PenalCode.findOne({
      _id: req.params.id,
      ativo: true
    }).lean();

    if (!item) {
      return res.status(404).json({ message: "Artigo não encontrado" });
    }

    return res.json(item);
  } catch (err) {
    console.error("Erro ao buscar artigo penal:", err);
    return res.status(500).json({ message: "Erro ao buscar artigo" });
  }
};

exports.getPenalCodeStats = async (req, res) => {
  try {
    const [total, infracoes, crimes, semFianca, destaques] = await Promise.all([
      PenalCode.countDocuments({ ativo: true }),
      PenalCode.countDocuments({ ativo: true, tipo: "INFRACAO" }),
      PenalCode.countDocuments({ ativo: true, tipo: "CRIME" }),
      PenalCode.countDocuments({ ativo: true, semFianca: true }),
      PenalCode.countDocuments({ ativo: true, destaque: true })
    ]);

    const categorias = await PenalCode.aggregate([
      { $match: { ativo: true } },
      { $group: { _id: "$categoria", total: { $sum: 1 } } },
      { $sort: { total: -1, _id: 1 } }
    ]);

    return res.json({
      total,
      infracoes,
      crimes,
      semFianca,
      destaques,
      categorias
    });
  } catch (err) {
    console.error("Erro ao gerar estatísticas do código penal:", err);
    return res.status(500).json({ message: "Erro ao gerar estatísticas" });
  }
};

exports.listQuickHighlights = async (req, res) => {
  try {
    const itens = await PenalCode.find({
      ativo: true,
      destaque: true
    })
      .sort({ ordem: 1, codigo: 1, titulo: 1 })
      .limit(12)
      .lean();

    return res.json(itens);
  } catch (err) {
    console.error("Erro ao listar destaques do código penal:", err);
    return res.status(500).json({ message: "Erro ao listar destaques" });
  }
};

// ==========================
// ADMIN
// ==========================

exports.listAdminPenalCodes = async (req, res) => {
  try {
    const { filtro, limite } = buildAdminFilter(req.query);

    const itens = await PenalCode.find(filtro)
      .sort({ ordem: 1, codigo: 1, titulo: 1 })
      .limit(limite)
      .lean();

    return res.json(itens);
  } catch (err) {
    console.error("Erro ao listar artigos no ADM:", err);
    return res.status(500).json({ message: "Erro ao listar artigos no ADM" });
  }
};

exports.createPenalCode = async (req, res) => {
  try {
    const {
      artigo,
      codigo,
      titulo,
      tipo,
      categoria,
      descricao,
      multa,
      prisaoMeses,
      semFianca,
      palavrasChave,
      observacoes,
      ordem,
      destaque,
      ativo
    } = req.body;

    if (!artigo || !codigo || !titulo || !tipo || !categoria || !descricao) {
      return res.status(400).json({
        message: "Artigo, código, título, tipo, categoria e descrição são obrigatórios."
      });
    }

    const codigoExistente = await PenalCode.findOne({
      codigo: String(codigo).trim()
    }).lean();

    if (codigoExistente) {
      return res.status(400).json({
        message: "Já existe um artigo com este código."
      });
    }

    const item = new PenalCode({
      artigo: String(artigo).trim(),
      codigo: String(codigo).trim(),
      titulo: String(titulo).trim(),
      tipo: String(tipo).trim(),
      categoria: String(categoria).trim(),
      descricao: String(descricao).trim(),
      multa: Number(multa || 0),
      prisaoMeses: Number(prisaoMeses || 0),
      semFianca: !!semFianca,
      palavrasChave: parseStringArray(palavrasChave),
      observacoes: parseStringArray(observacoes),
      ordem: Number(ordem || 0),
      destaque: !!destaque,
      ativo: ativo === undefined ? true : !!ativo
    });

    appendHistory(item, req, "CRIACAO", "Artigo penal criado no painel administrativo.");

    await item.save();

    return res.status(201).json(item);
  } catch (err) {
    console.error("Erro ao criar artigo penal:", err);
    return res.status(500).json({ message: "Erro ao criar artigo penal" });
  }
};

exports.updatePenalCode = async (req, res) => {
  try {
    const item = await PenalCode.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Artigo não encontrado." });
    }

    const {
      artigo,
      codigo,
      titulo,
      tipo,
      categoria,
      descricao,
      multa,
      prisaoMeses,
      semFianca,
      palavrasChave,
      observacoes,
      ordem,
      destaque,
      ativo
    } = req.body;

    if (codigo !== undefined && String(codigo).trim() !== item.codigo) {
      const codigoExistente = await PenalCode.findOne({
        codigo: String(codigo).trim(),
        _id: { $ne: item._id }
      }).lean();

      if (codigoExistente) {
        return res.status(400).json({
          message: "Já existe outro artigo com este código."
        });
      }
    }

    if (artigo !== undefined) item.artigo = String(artigo).trim();
    if (codigo !== undefined) item.codigo = String(codigo).trim();
    if (titulo !== undefined) item.titulo = String(titulo).trim();
    if (tipo !== undefined) item.tipo = String(tipo).trim();
    if (categoria !== undefined) item.categoria = String(categoria).trim();
    if (descricao !== undefined) item.descricao = String(descricao).trim();
    if (multa !== undefined) item.multa = Number(multa || 0);
    if (prisaoMeses !== undefined) item.prisaoMeses = Number(prisaoMeses || 0);
    if (semFianca !== undefined) item.semFianca = !!semFianca;
    if (palavrasChave !== undefined) item.palavrasChave = parseStringArray(palavrasChave);
    if (observacoes !== undefined) item.observacoes = parseStringArray(observacoes);
    if (ordem !== undefined) item.ordem = Number(ordem || 0);
    if (destaque !== undefined) item.destaque = !!destaque;
    if (ativo !== undefined) item.ativo = !!ativo;

    appendHistory(item, req, "EDICAO", "Artigo penal atualizado pelo administrativo.");

    await item.save();

    return res.json(item);
  } catch (err) {
    console.error("Erro ao atualizar artigo penal:", err);
    return res.status(500).json({ message: "Erro ao atualizar artigo penal" });
  }
};

exports.toggleActivePenalCode = async (req, res) => {
  try {
    const item = await PenalCode.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Artigo não encontrado." });
    }

    item.ativo = !item.ativo;

    appendHistory(
      item,
      req,
      item.ativo ? "REATIVACAO" : "DESATIVACAO",
      item.ativo
        ? "Artigo reativado pelo administrativo."
        : "Artigo desativado pelo administrativo."
    );

    await item.save();

    return res.json({
      message: item.ativo ? "Artigo ativado com sucesso." : "Artigo desativado com sucesso.",
      item
    });
  } catch (err) {
    console.error("Erro ao alternar status do artigo penal:", err);
    return res.status(500).json({ message: "Erro ao alterar status do artigo" });
  }
};

exports.toggleHighlightPenalCode = async (req, res) => {
  try {
    const item = await PenalCode.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Artigo não encontrado." });
    }

    item.destaque = !item.destaque;

    appendHistory(
      item,
      req,
      item.destaque ? "DESTAQUE_ATIVADO" : "DESTAQUE_REMOVIDO",
      item.destaque
        ? "Artigo marcado como destaque."
        : "Artigo removido dos destaques."
    );

    await item.save();

    return res.json({
      message: item.destaque
        ? "Artigo marcado como destaque."
        : "Artigo removido dos destaques.",
      item
    });
  } catch (err) {
    console.error("Erro ao alternar destaque do artigo penal:", err);
    return res.status(500).json({ message: "Erro ao alterar destaque do artigo" });
  }
};

exports.deletePenalCode = async (req, res) => {
  try {
    const item = await PenalCode.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Artigo não encontrado." });
    }

    await item.deleteOne();

    return res.json({ message: "Artigo removido com sucesso." });
  } catch (err) {
    console.error("Erro ao excluir artigo penal:", err);
    return res.status(500).json({ message: "Erro ao excluir artigo penal" });
  }
};