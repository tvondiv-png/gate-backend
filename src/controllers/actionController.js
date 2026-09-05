const mongoose = require("mongoose");
const Action = require("../models/Action");
const Hierarchy = require("../models/Hierarchy");
const { ACTION_RULES, getActionRuleByCode } = require("../utils/actionRules");

function normalizeParticipantes(participantes) {
  if (!Array.isArray(participantes)) return [];

  return participantes
    .filter(Boolean)
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);
}

function buildHistorico(tipo, req, observacao = "") {
  return {
    tipo,
    data: new Date(),
    autorId: req.user?._id || null,
    autorNome: req.user?.nome || "Sistema",
    observacao
  };
}

function parseDateOnly(value) {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

function validarObjectIds(ids) {
  return ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
}

async function buscarParticipantesValidos(uniqueIds) {
  const validObjectIds = validarObjectIds(uniqueIds);

  if (validObjectIds.length !== uniqueIds.length) {
    return {
      erro: {
        status: 400,
        body: { message: "Há participantes com identificador inválido" }
      }
    };
  }

  const policiais = await Hierarchy.find({
    user: { $in: validObjectIds }
  }).lean();

  if (!policiais || policiais.length === 0) {
    return {
      erro: {
        status: 400,
        body: { message: "Participantes inválidos" }
      }
    };
  }

  const encontradosIds = new Set(
    policiais.map((p) => String(p.user))
  );

  const faltantes = validObjectIds.filter(
    (id) => !encontradosIds.has(String(id))
  );

  if (faltantes.length > 0) {
    return {
      erro: {
        status: 400,
        body: {
          message: "Um ou mais participantes não foram encontrados na hierarquia",
          faltantes
        }
      }
    };
  }

  const participantesSnapshot = policiais.map((p) => ({
    userId: p.user,
    funcional: String(p.funcional),
    patente: p.patente,
    nome: p.nome
  }));

  return { participantesSnapshot };
}

exports.listRules = async (req, res) => {
  return res.json(ACTION_RULES);
};

exports.createAction = async (req, res) => {
  try {
    const {
      tipoAcao,
      resultado,
      numeroAcao,
      dataAcao,
      observacoes,
      participantes
    } = req.body;

    if (!tipoAcao || !resultado || !numeroAcao || !dataAcao) {
      return res.status(400).json({ message: "Preencha os campos obrigatórios" });
    }

    const dataAcaoNormalizada = parseDateOnly(dataAcao);
    if (!dataAcaoNormalizada) {
      return res.status(400).json({ message: "Data da ação inválida" });
    }

    const rule = getActionRuleByCode(tipoAcao);
    if (!rule) {
      return res.status(400).json({ message: "Tipo de ação inválido" });
    }

    if (!["GANHA", "PERDIDA"].includes(String(resultado))) {
      return res.status(400).json({ message: "Resultado inválido" });
    }

    const numeroAcaoLimpo = String(numeroAcao).trim();
    const participantesIds = normalizeParticipantes(participantes);

    if (participantesIds.length === 0) {
      return res.status(400).json({ message: "Selecione ao menos 1 participante" });
    }

    const uniqueIds = [...new Set(participantesIds)];

    if (!uniqueIds.includes(String(req.user._id))) {
      uniqueIds.push(String(req.user._id));
    }

    const resultadoParticipantes = await buscarParticipantesValidos(uniqueIds);

    if (resultadoParticipantes.erro) {
      return res
        .status(resultadoParticipantes.erro.status)
        .json(resultadoParticipantes.erro.body);
    }

    const { participantesSnapshot } = resultadoParticipantes;

    const action = await Action.create({
      tipoAcao: rule.codigo,
      nomeTipoAcao: rule.nome,
      categoriaAcao: rule.categoria,
      resultado: String(resultado),
      numeroAcao: numeroAcaoLimpo,
      dataAcao: dataAcaoNormalizada,
      observacoes: observacoes || "",
      registrante: {
        userId: req.user._id,
        funcional: String(req.user.funcional || ""),
        patente: req.user.patente || "",
        nome: req.user.nome || ""
      },
      participantes: participantesSnapshot,
      status: "PENDENTE",
      historicoValidacao: [
        buildHistorico("CRIADA", req, "Ação criada e enviada para validação")
      ]
    });

    return res.status(201).json(action);
  } catch (err) {
    console.error("Erro ao criar ação:", err);
    return res.status(500).json({ message: "Erro interno ao criar ação" });
  }
};

exports.listMyActions = async (req, res) => {
  try {
    const items = await Action.find({
      "registrante.userId": req.user._id
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(items);
  } catch (err) {
    console.error("Erro ao listar minhas ações:", err);
    return res.status(500).json({ message: "Erro ao listar ações" });
  }
};

exports.getMyActionById = async (req, res) => {
  try {
    const item = await Action.findOne({
      _id: req.params.id,
      "registrante.userId": req.user._id
    }).lean();

    if (!item) {
      return res.status(404).json({ message: "Ação não encontrada" });
    }

    return res.json(item);
  } catch (err) {
    console.error("Erro ao buscar ação:", err);
    return res.status(500).json({ message: "Erro ao buscar ação" });
  }
};

exports.resubmitAction = async (req, res) => {
  try {
    const item = await Action.findOne({
      _id: req.params.id,
      "registrante.userId": req.user._id
    });

    if (!item) {
      return res.status(404).json({ message: "Ação não encontrada" });
    }

    if (item.status !== "REJEITADA") {
      return res.status(400).json({
        message: "Somente ações rejeitadas podem ser reenviadas"
      });
    }

    const {
      tipoAcao,
      resultado,
      numeroAcao,
      dataAcao,
      observacoes,
      participantes
    } = req.body;

    if (!tipoAcao || !resultado || !numeroAcao || !dataAcao) {
      return res.status(400).json({ message: "Preencha os campos obrigatórios" });
    }

    const dataAcaoNormalizada = parseDateOnly(dataAcao);
    if (!dataAcaoNormalizada) {
      return res.status(400).json({ message: "Data da ação inválida" });
    }

    const rule = getActionRuleByCode(tipoAcao);
    if (!rule) {
      return res.status(400).json({ message: "Tipo de ação inválido" });
    }

    if (!["GANHA", "PERDIDA"].includes(String(resultado))) {
      return res.status(400).json({ message: "Resultado inválido" });
    }

    const numeroAcaoLimpo = String(numeroAcao).trim();
    const participantesIds = normalizeParticipantes(participantes);

    if (participantesIds.length === 0) {
      return res.status(400).json({ message: "Selecione ao menos 1 participante" });
    }

    const uniqueIds = [...new Set(participantesIds)];

    if (!uniqueIds.includes(String(req.user._id))) {
      uniqueIds.push(String(req.user._id));
    }

    const resultadoParticipantes = await buscarParticipantesValidos(uniqueIds);

    if (resultadoParticipantes.erro) {
      return res
        .status(resultadoParticipantes.erro.status)
        .json(resultadoParticipantes.erro.body);
    }

    const { participantesSnapshot } = resultadoParticipantes;

    item.tipoAcao = rule.codigo;
    item.nomeTipoAcao = rule.nome;
    item.categoriaAcao = rule.categoria;
    item.resultado = String(resultado);
    item.numeroAcao = numeroAcaoLimpo;
    item.dataAcao = dataAcaoNormalizada;
    item.observacoes = observacoes || "";
    item.participantes = participantesSnapshot;
    item.status = "REENVIADA";
    item.reenviadoEm = new Date();
    item.versaoEnvio += 1;
    item.motivoRejeicao = "";
    item.observacaoAdmin = "";

    item.historicoValidacao.push(
      buildHistorico("REENVIADA", req, "Ação corrigida e reenviada para validação")
    );

    await item.save();

    return res.json(item);
  } catch (err) {
    console.error("Erro ao reenviar ação:", err);
    return res.status(500).json({ message: "Erro ao reenviar ação" });
  }
};