const DisciplinaryCase = require("../models/DisciplinaryCase");
const Notification = require("../models/Notification");
const User = require("../models/User");
const logAction = require("../utils/logAction");

function buildCaseNumber(prefixo, sequencial, ano) {
  return `${prefixo}-${String(sequencial).padStart(3, "0")}/${ano}`;
}

function pushHistorico(caso, { acao, descricao = "", autor = null, origem = "SISTEMA" }) {
  caso.historico.push({
    acao,
    descricao,
    autor,
    origem,
    createdAt: new Date()
  });
}

async function criarNotificacao({
  user,
  titulo,
  mensagem,
  tipo = "GERAL",
  referenciaId = null,
  referenciaModelo = "",
  metadata = {}
}) {
  await Notification.create({
    user,
    titulo,
    mensagem,
    tipo,
    referenciaId,
    referenciaModelo,
    metadata
  });
}

exports.listCases = async (req, res) => {
  try {
    const items = await DisciplinaryCase.find()
      .populate("policial", "nome funcional patente")
      .populate("criadoPor", "nome funcional patente")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    console.error("Erro ao listar processos disciplinares:", err);
    res.status(500).json({ message: "Erro ao listar processos" });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const item = await DisciplinaryCase.findById(req.params.id)
      .populate("policial", "nome funcional patente")
      .populate("criadoPor", "nome funcional patente")
      .populate("comentarios.autor", "nome funcional patente")
      .populate("manifestacoes.autor", "nome funcional patente")
      .populate("historico.autor", "nome funcional patente");

    if (!item) {
      return res.status(404).json({ message: "Processo não encontrado" });
    }

    res.json(item);
  } catch (err) {
    console.error("Erro ao buscar processo disciplinar:", err);
    res.status(500).json({ message: "Erro ao buscar processo" });
  }
};

exports.createCase = async (req, res) => {
  try {
    const {
      policialId,
      tipo,
      descricao,
      prioridade,
      prazoResposta,
      artigosPenais = [],
      artigosDisciplinares = []
    } = req.body;

    if (!policialId || !tipo || !descricao) {
      return res.status(400).json({
        message: "Policial, tipo e descrição são obrigatórios"
      });
    }

    const policial = await User.findById(policialId).lean();
    if (!policial) {
      return res.status(404).json({ message: "Policial não encontrado" });
    }

    const anoAtual = new Date().getFullYear();
    const totalAno = await DisciplinaryCase.countDocuments({ ano: anoAtual });
    const numero = buildCaseNumber("IPM", totalAno + 1, anoAtual);

    const novoCaso = await DisciplinaryCase.create({
      numero,
      ano: anoAtual,
      policial: policialId,
      tipo,
      descricao,
      prioridade: prioridade || "MEDIA",
      prazoResposta: prazoResposta || null,
      artigosPenais,
      artigosDisciplinares,
      status: "AGUARDANDO_CIENCIA",
      criadoPor: req.user.id,
      historico: [
        {
          acao: "PROCESSO_CRIADO",
          descricao: `Processo ${numero} criado`,
          autor: req.user.id,
          origem: "SJD",
          createdAt: new Date()
        }
      ]
    });

    await criarNotificacao({
      user: policialId,
      titulo: "Processo disciplinar aberto",
      mensagem: `Foi aberto o processo ${numero} em seu nome. Acesse o painel para tomar ciência e acompanhar o andamento.`,
      tipo: "DISCIPLINA_ABERTURA",
      referenciaId: novoCaso._id,
      referenciaModelo: "DisciplinaryCase",
      metadata: {
        numero,
        tipo
      }
    });

    await logAction({
      action: "ABERTURA DE PROCESSO DISCIPLINAR",
      performedBy: req.user.id,
      targetUser: policialId,
      details: numero
    });

    res.status(201).json(novoCaso);
  } catch (err) {
    console.error("Erro ao criar processo disciplinar:", err);
    res.status(500).json({ message: "Erro ao criar processo" });
  }
};

exports.addComentario = async (req, res) => {
  try {
    const { texto } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ message: "Informe o comentário" });
    }

    const caso = await DisciplinaryCase.findById(req.params.id);

    if (!caso) {
      return res.status(404).json({ message: "Processo não encontrado" });
    }

    caso.comentarios.push({
      texto: texto.trim(),
      autor: req.user.id,
      origem: "SJD",
      createdAt: new Date()
    });

    if (caso.status === "ABERTO") {
      caso.status = "EM_ANALISE";
    }

    pushHistorico(caso, {
      acao: "COMENTARIO_SJD",
      descricao: "Comentário registrado pelo SJD",
      autor: req.user.id,
      origem: "SJD"
    });

    await caso.save();

    await criarNotificacao({
      user: caso.policial,
      titulo: "Atualização em processo disciplinar",
      mensagem: `O processo ${caso.numero} recebeu uma nova atualização do SJD.`,
      tipo: "DISCIPLINA_COMENTARIO",
      referenciaId: caso._id,
      referenciaModelo: "DisciplinaryCase",
      metadata: {
        numero: caso.numero
      }
    });

    res.json(caso);
  } catch (err) {
    console.error("Erro ao adicionar comentário:", err);
    res.status(500).json({ message: "Erro ao adicionar comentário" });
  }
};

exports.convocar = async (req, res) => {
  try {
    const { mensagem, dataAudiencia, local, obrigatoria } = req.body;

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ message: "Informe a convocação" });
    }

    const caso = await DisciplinaryCase.findById(req.params.id);

    if (!caso) {
      return res.status(404).json({ message: "Processo não encontrado" });
    }

    caso.convocacoes.push({
      mensagem: mensagem.trim(),
      dataAudiencia: dataAudiencia || null,
      local: local || "",
      obrigatoria: obrigatoria !== false,
      ciente: false,
      compareceu: false,
      createdAt: new Date()
    });

    caso.status = "CONVOCADO";

    pushHistorico(caso, {
      acao: "CONVOCACAO_REGISTRADA",
      descricao: "Convocação disciplinar emitida",
      autor: req.user.id,
      origem: "SJD"
    });

    await caso.save();

    await criarNotificacao({
      user: caso.policial,
      titulo: "Convocação disciplinar",
      mensagem:
        mensagem.trim() ||
        `Você recebeu uma convocação no processo ${caso.numero}.`,
      tipo: "DISCIPLINA_CONVOCACAO",
      referenciaId: caso._id,
      referenciaModelo: "DisciplinaryCase",
      metadata: {
        numero: caso.numero,
        dataAudiencia: dataAudiencia || null,
        local: local || ""
      }
    });

    res.json(caso);
  } catch (err) {
    console.error("Erro ao convocar policial:", err);
    res.status(500).json({ message: "Erro ao registrar convocação" });
  }
};

exports.concluir = async (req, res) => {
  try {
    const {
      conclusao,
      artigosPenais = [],
      artigosDisciplinares = [],
      atenuantes = [],
      agravantes = [],
      sancaoFinal
    } = req.body;

    const caso = await DisciplinaryCase.findById(req.params.id);

    if (!caso) {
      return res.status(404).json({ message: "Processo não encontrado" });
    }

    caso.conclusao = {
      texto: conclusao || "",
      data: new Date()
    };

    caso.artigosPenais = Array.isArray(artigosPenais) ? artigosPenais : [];
    caso.artigosDisciplinares = Array.isArray(artigosDisciplinares)
      ? artigosDisciplinares
      : [];
    caso.atenuantes = Array.isArray(atenuantes) ? atenuantes : [];
    caso.agravantes = Array.isArray(agravantes) ? agravantes : [];

    caso.sancaoFinal = {
      tipo: sancaoFinal?.tipo || "OUTRA",
      padNivel: Number(sancaoFinal?.padNivel || 0),
      descricao: sancaoFinal?.descricao || "",
      dataAplicacao: new Date()
    };

    caso.status =
      caso.sancaoFinal?.tipo === "ARQUIVAMENTO"
        ? "ARQUIVADO"
        : "SANCAO_APLICADA";

    pushHistorico(caso, {
      acao: "PROCESSO_CONCLUIDO",
      descricao: "Conclusão do processo disciplinar registrada",
      autor: req.user.id,
      origem: "SJD"
    });

    await caso.save();

    await criarNotificacao({
      user: caso.policial,
      titulo: "Processo disciplinar concluído",
      mensagem: `O processo ${caso.numero} foi concluído. Consulte a conclusão e eventual sanção aplicada.`,
      tipo:
        caso.sancaoFinal?.padNivel > 0
          ? "DISCIPLINA_PAD"
          : "DISCIPLINA_CONCLUSAO",
      referenciaId: caso._id,
      referenciaModelo: "DisciplinaryCase",
      metadata: {
        numero: caso.numero,
        sancao: caso.sancaoFinal?.tipo || ""
      }
    });

    res.json(caso);
  } catch (err) {
    console.error("Erro ao concluir processo:", err);
    res.status(500).json({ message: "Erro ao concluir processo" });
  }
};

exports.excluirCaso = async (req, res) => {
  try {
    const caso = await DisciplinaryCase.findById(req.params.id);

    if (!caso) {
      return res.status(404).json({ message: "Processo não encontrado" });
    }

    await caso.deleteOne();

    await logAction({
      action: "EXCLUSÃO DE PROCESSO DISCIPLINAR",
      performedBy: req.user.id,
      targetUser: caso.policial,
      details: caso.numero
    });

    res.json({ message: "Processo excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir processo:", err);
    res.status(500).json({ message: "Erro ao excluir processo" });
  }
};

exports.listMyCases = async (req, res) => {
  try {
    const items = await DisciplinaryCase.find({
      policial: req.user.id
    }).sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    console.error("Erro ao listar meus processos:", err);
    res.status(500).json({ message: "Erro ao listar meus processos" });
  }
};

exports.getMyCaseById = async (req, res) => {
  try {
    const item = await DisciplinaryCase.findOne({
      _id: req.params.id,
      policial: req.user.id
    })
      .populate("comentarios.autor", "nome funcional patente")
      .populate("manifestacoes.autor", "nome funcional patente")
      .populate("historico.autor", "nome funcional patente");

    if (!item) {
      return res.status(404).json({ message: "Processo não encontrado" });
    }

    res.json(item);
  } catch (err) {
    console.error("Erro ao buscar meu processo:", err);
    res.status(500).json({ message: "Erro ao buscar processo" });
  }
};

exports.confirmarCiencia = async (req, res) => {
  try {
    const caso = await DisciplinaryCase.findOne({
      _id: req.params.id,
      policial: req.user.id
    });

    if (!caso) {
      return res.status(404).json({ message: "Processo não encontrado" });
    }

    caso.cienciaPolicial = {
      confirmada: true,
      data: new Date()
    };

    if (caso.status === "AGUARDANDO_CIENCIA" || caso.status === "ABERTO") {
      caso.status = "AGUARDANDO_MANIFESTACAO";
    }

    pushHistorico(caso, {
      acao: "CIENCIA_CONFIRMADA",
      descricao: "O policial tomou ciência formal do processo",
      autor: req.user.id,
      origem: "POLICIAL"
    });

    await caso.save();

    await criarNotificacao({
      user: caso.criadoPor,
      titulo: "Ciência registrada pelo policial",
      mensagem: `O policial vinculado ao processo ${caso.numero} confirmou ciência.`,
      tipo: "DISCIPLINA_MANIFESTACAO",
      referenciaId: caso._id,
      referenciaModelo: "DisciplinaryCase",
      metadata: {
        numero: caso.numero
      }
    });

    res.json(caso);
  } catch (err) {
    console.error("Erro ao confirmar ciência:", err);
    res.status(500).json({ message: "Erro ao confirmar ciência" });
  }
};

exports.enviarManifestacao = async (req, res) => {
  try {
    const { texto, tipo } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ message: "Informe sua manifestação" });
    }

    const caso = await DisciplinaryCase.findOne({
      _id: req.params.id,
      policial: req.user.id
    });

    if (!caso) {
      return res.status(404).json({ message: "Processo não encontrado" });
    }

    caso.manifestacoes.push({
      texto: texto.trim(),
      autor: req.user.id,
      tipo: tipo || "RESPOSTA",
      createdAt: new Date()
    });

    if (
      caso.status === "AGUARDANDO_MANIFESTACAO" ||
      caso.status === "CONVOCADO"
    ) {
      caso.status = "EM_ANALISE";
    }

    pushHistorico(caso, {
      acao: "MANIFESTACAO_POLICIAL",
      descricao: "Manifestação do policial registrada no processo",
      autor: req.user.id,
      origem: "POLICIAL"
    });

    await caso.save();

    await criarNotificacao({
      user: caso.criadoPor,
      titulo: "Nova manifestação do policial",
      mensagem: `O policial respondeu no processo ${caso.numero}.`,
      tipo: "DISCIPLINA_MANIFESTACAO",
      referenciaId: caso._id,
      referenciaModelo: "DisciplinaryCase",
      metadata: {
        numero: caso.numero
      }
    });

    res.json(caso);
  } catch (err) {
    console.error("Erro ao enviar manifestação:", err);
    res.status(500).json({ message: "Erro ao enviar manifestação" });
  }
};