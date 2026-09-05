const ProfileUpdateRequest = require("../models/ProfileUpdateRequest");
const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");
const Notification = require("../models/Notification");
const logAction = require("../utils/logAction");

const CURSOS_DISPONIVEIS = [
  "Curso Modulação",
  "SAT-B",
  "Escola ESSgt",
  "Academia Barro Branco",
  "Tiro Básico",
  "Tiro Avançado",
  "POP",
  "Curso de Abordagem"
];

const MEDALHAS_DISPONIVEIS = [
  "Láurea do Mérito Pessoal – 5º Grau",
  "Láurea do Mérito Pessoal – 4º Grau",
  "Láurea do Mérito Pessoal – 3º Grau",
  "Láurea do Mérito Pessoal – 2º Grau",
  "Láurea do Mérito Pessoal – 1º Grau"
];

const PATENTES_DISPONIVEIS = [
  "Coronel PM",
  "Tenente-Coronel PM",
  "Major PM",
  "Capitão PM",
  "1º Tenente PM",
  "2º Tenente PM",
  "Aspirante a Oficial PM",
  "Subtenente PM",
  "1º Sargento PM",
  "2º Sargento PM",
  "3º Sargento PM",
  "Cabo PM",
  "Soldado 1ª Classe PM",
  "Soldado 2ª Classe PM"
];

function parseDateOnlyToUTC(dateString) {
  if (!dateString) return null;
  const [year, month, day] = String(dateString).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function uniqueStrings(list = []) {
  return [...new Set((list || []).map((item) => String(item).trim()).filter(Boolean))];
}

function definirCategoriaPorPatente(patente = "") {
  const mapa = {
    "Coronel PM": "OFICIAIS_SUPERIORES",
    "Tenente-Coronel PM": "OFICIAIS_SUPERIORES",
    "Major PM": "OFICIAIS_SUPERIORES",
    "Capitão PM": "OFICIAIS_INTERMEDIARIOS",
    "1º Tenente PM": "OFICIAIS_SUBALTERNOS",
    "2º Tenente PM": "OFICIAIS_SUBALTERNOS",
    "Aspirante a Oficial PM": "OFICIAIS_SUBALTERNOS",
    "Subtenente PM": "PRACAS_ESPECIAIS",
    "1º Sargento PM": "PRACAS_GRADUADAS",
    "2º Sargento PM": "PRACAS_GRADUADAS",
    "3º Sargento PM": "PRACAS_GRADUADAS",
    "Cabo PM": "PRACAS",
    "Soldado 1ª Classe PM": "PRACAS",
    "Soldado 2ª Classe PM": "PRACAS"
  };

  return mapa[patente] || "";
}

function tipoLabel(tipo) {
  const tipoLabelMap = {
    CURSO: "Curso",
    MEDALHA: "Medalha",
    PROMOCAO: "Promoção",
    ALTERACAO_NOME: "Alteração de Nome",
    ALTERACAO_FUNCIONAL: "Alteração de Funcional"
  };

  return tipoLabelMap[tipo] || tipo;
}

async function notificarAdminsNovaRequisicao(request) {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "superadmin"] },
      ativo: { $ne: false }
    })
      .select("_id")
      .lean();

    if (!admins.length) return;

    const notificacoes = admins.map((admin) => ({
      user: admin._id,
      mensagem:
        `Nova requisição cadastral pendente: ${tipoLabel(request.tipo)}. ` +
        `Solicitante: ${request.solicitante.funcional} - ${request.solicitante.nome}.`
    }));

    await Notification.insertMany(notificacoes);
  } catch (error) {
    console.error("Erro ao notificar administradores sobre nova requisição:", error);
  }
}

async function notificarPolicialStatus(request, mensagem) {
  try {
    if (!request?.solicitante?.userId) return;

    await Notification.create({
      user: request.solicitante.userId,
      mensagem
    });
  } catch (error) {
    console.error("Erro ao notificar policial sobre atualização da requisição:", error);
  }
}

exports.getMetadata = async (req, res) => {
  try {
    res.json({
      cursos: CURSOS_DISPONIVEIS,
      medalhas: MEDALHAS_DISPONIVEIS,
      patentes: PATENTES_DISPONIVEIS
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao carregar metadados",
      error: error.message
    });
  }
};

exports.create = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const {
      tipo,
      curso,
      medalha,
      novaPatente,
      novoNome,
      novaFuncional,
      dataReferencia,
      numeroBoletim,
      nomeInstrutor
    } = req.body;

    if (!tipo) {
      return res.status(400).json({ message: "Tipo da requisição é obrigatório." });
    }

    const hierarchy = await Hierarchy.findOne({
      $or: [{ user: user._id }, { funcional: user.funcional }]
    }).lean();

    const existePendente = await ProfileUpdateRequest.findOne({
      "solicitante.userId": user._id,
      tipo,
      status: "PENDENTE"
    });

    if (existePendente) {
      return res.status(400).json({
        message: "Já existe uma requisição pendente deste tipo para este policial."
      });
    }

    const dadosSolicitados = {
      curso: "",
      medalha: "",
      novaPatente: "",
      novoNome: "",
      novaFuncional: null,
      dataReferencia: parseDateOnlyToUTC(dataReferencia),
      numeroBoletim: numeroBoletim || "",
      nomeInstrutor: nomeInstrutor || ""
    };

    if (tipo === "CURSO") {
      if (!curso || !dataReferencia || !numeroBoletim || !nomeInstrutor) {
        return res.status(400).json({
          message: "Curso, data, número do boletim e instrutor são obrigatórios."
        });
      }

      const cursosAtuais = hierarchy?.cursos || user.cursos || [];
      if (cursosAtuais.includes(curso)) {
        return res.status(400).json({
          message: "Este curso já está cadastrado para o policial."
        });
      }

      dadosSolicitados.curso = curso;
    }

    if (tipo === "MEDALHA") {
      if (!medalha || !dataReferencia || !numeroBoletim) {
        return res.status(400).json({
          message: "Medalha, data e número do boletim são obrigatórios."
        });
      }

      const medalhasAtuais = hierarchy?.medalhas || user.medalhas || [];
      if (medalhasAtuais.includes(medalha)) {
        return res.status(400).json({
          message: "Esta medalha já está cadastrada para o policial."
        });
      }

      dadosSolicitados.medalha = medalha;
    }

    if (tipo === "PROMOCAO") {
      if (!novaPatente || !dataReferencia || !numeroBoletim) {
        return res.status(400).json({
          message: "Nova patente, data e número do boletim são obrigatórios."
        });
      }

      if (String(user.patente || "") === String(novaPatente)) {
        return res.status(400).json({
          message: "A patente solicitada já é a patente atual do policial."
        });
      }

      dadosSolicitados.novaPatente = novaPatente;
    }

    if (tipo === "ALTERACAO_NOME") {
      if (!novoNome || !dataReferencia || !numeroBoletim) {
        return res.status(400).json({
          message: "Novo nome, data e número do boletim são obrigatórios."
        });
      }

      const nomeNormalizado = String(novoNome).trim();

      if (nomeNormalizado === String(user.nome || "").trim()) {
        return res.status(400).json({
          message: "O novo nome é igual ao nome atual."
        });
      }

      dadosSolicitados.novoNome = nomeNormalizado;
    }

    if (tipo === "ALTERACAO_FUNCIONAL") {
      if (!novaFuncional || !dataReferencia || !numeroBoletim) {
        return res.status(400).json({
          message: "Nova funcional, data e número do boletim são obrigatórios."
        });
      }

      if (Number(novaFuncional) === Number(user.funcional)) {
        return res.status(400).json({
          message: "A funcional informada já é a funcional atual do policial."
        });
      }

      const funcionalJaExiste = await User.findOne({
        funcional: Number(novaFuncional),
        _id: { $ne: user._id }
      }).lean();

      if (funcionalJaExiste) {
        return res.status(400).json({
          message: "Já existe outro usuário com esta funcional."
        });
      }

      dadosSolicitados.novaFuncional = Number(novaFuncional);
    }

    const request = await ProfileUpdateRequest.create({
      tipo,
      solicitante: {
        userId: user._id,
        funcional: Number(user.funcional || 0),
        nome: user.nome || "",
        patente: user.patente || ""
      },
      dadosAtuais: {
        nome: user.nome || "",
        funcional: Number(user.funcional || 0),
        patente: user.patente || "",
        cursos: hierarchy?.cursos || user.cursos || [],
        medalhas: hierarchy?.medalhas || user.medalhas || []
      },
      dadosSolicitados,
      historico: [
        {
          acao: "CRIADA",
          autorId: user._id,
          autorNome: user.nome || "",
          autorPatente: user.patente || "",
          observacao: "Requisição criada pelo policial."
        }
      ]
    });

    await notificarAdminsNovaRequisicao(request);

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao criar requisição",
      error: error.message
    });
  }
};

exports.listMine = async (req, res) => {
  try {
    const list = await ProfileUpdateRequest.find({
      "solicitante.userId": req.user._id
    }).sort({ createdAt: -1 });

    res.json(list);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao listar minhas requisições",
      error: error.message
    });
  }
};

exports.listAdmin = async (req, res) => {
  try {
    const list = await ProfileUpdateRequest.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao listar requisições",
      error: error.message
    });
  }
};

exports.approve = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Requisição não encontrada." });
    }

    if (request.status !== "PENDENTE") {
      return res.status(400).json({
        message: "Essa requisição já foi processada."
      });
    }

    const admin = await User.findById(req.user._id);
    const user = await User.findById(request.solicitante.userId);

    if (!user) {
      return res.status(404).json({ message: "Usuário solicitante não encontrado." });
    }

    const hierarchy = await Hierarchy.findOne({
      $or: [{ user: user._id }, { funcional: user.funcional }]
    });

    if (!hierarchy) {
      return res.status(404).json({
        message: "Hierarquia do policial não encontrada."
      });
    }

    const dados = request.dadosSolicitados || {};

    if (request.tipo === "CURSO") {
      hierarchy.cursos = uniqueStrings([...(hierarchy.cursos || []), dados.curso]);
      user.cursos = uniqueStrings([...(user.cursos || []), dados.curso]);
    }

    if (request.tipo === "MEDALHA") {
      hierarchy.medalhas = uniqueStrings([...(hierarchy.medalhas || []), dados.medalha]);
      user.medalhas = uniqueStrings([...(user.medalhas || []), dados.medalha]);
    }

    if (request.tipo === "PROMOCAO") {
      hierarchy.patente = dados.novaPatente;
      hierarchy.categoria = definirCategoriaPorPatente(dados.novaPatente);
      hierarchy.dataUltimaPromocao = dados.dataReferencia;

      user.patente = dados.novaPatente;
      user.categoriaHierarquia = definirCategoriaPorPatente(dados.novaPatente);
      user.dataUltimaPromocao = dados.dataReferencia;
    }

    if (request.tipo === "ALTERACAO_NOME") {
      hierarchy.nome = dados.novoNome;
      user.nome = dados.novoNome;
    }

    if (request.tipo === "ALTERACAO_FUNCIONAL") {
      const funcionalEmUsoHierarchy = await Hierarchy.findOne({
        funcional: Number(dados.novaFuncional),
        _id: { $ne: hierarchy._id }
      });

      if (funcionalEmUsoHierarchy) {
        return res.status(400).json({
          message: "A funcional informada já está em uso na hierarquia."
        });
      }

      const funcionalEmUsoUser = await User.findOne({
        funcional: Number(dados.novaFuncional),
        _id: { $ne: user._id }
      });

      if (funcionalEmUsoUser) {
        return res.status(400).json({
          message: "A funcional informada já está em uso por outro usuário."
        });
      }

      user.funcional = Number(dados.novaFuncional);
      hierarchy.funcional = Number(dados.novaFuncional);
    }

    await user.save();
    await hierarchy.save();

    request.status = "APROVADA";
    request.validadoPor = {
      userId: admin?._id || null,
      nome: admin?.nome || "",
      patente: admin?.patente || "",
      role: admin?.role || ""
    };
    request.validadoEm = new Date();
    request.observacaoAdmin = req.body.observacaoAdmin || "Requisição aprovada.";

    request.historico.push({
      acao: "APROVADA",
      autorId: admin?._id || null,
      autorNome: admin?.nome || "",
      autorPatente: admin?.patente || "",
      observacao: req.body.observacaoAdmin || "Requisição aprovada."
    });

    await request.save();

    await notificarPolicialStatus(
      request,
      `Sua requisição cadastral de ${tipoLabel(request.tipo)} foi aprovada por ${admin?.nome || "Administrador"}.`
    );

    await logAction({
      action: "REQUISIÇÃO CADASTRAL APROVADA",
      performedBy: req.user.id,
      targetUser: user._id,
      details: `${request.tipo} aprovada`
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao aprovar requisição",
      error: error.message
    });
  }
};

exports.reject = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Requisição não encontrada." });
    }

    if (request.status !== "PENDENTE") {
      return res.status(400).json({
        message: "Essa requisição já foi processada."
      });
    }

    const admin = await User.findById(req.user._id);

    request.status = "REJEITADA";
    request.validadoPor = {
      userId: admin?._id || null,
      nome: admin?.nome || "",
      patente: admin?.patente || "",
      role: admin?.role || ""
    };
    request.validadoEm = new Date();
    request.observacaoAdmin = req.body.observacaoAdmin || "Requisição rejeitada.";

    request.historico.push({
      acao: "REJEITADA",
      autorId: admin?._id || null,
      autorNome: admin?.nome || "",
      autorPatente: admin?.patente || "",
      observacao: req.body.observacaoAdmin || "Requisição rejeitada."
    });

    await request.save();

    await notificarPolicialStatus(
      request,
      `Sua requisição cadastral de ${tipoLabel(request.tipo)} foi rejeitada por ${admin?.nome || "Administrador"}.`
    );

    await logAction({
      action: "REQUISIÇÃO CADASTRAL REJEITADA",
      performedBy: req.user.id,
      targetUser: request.solicitante.userId,
      details: `${request.tipo} rejeitada`
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao rejeitar requisição",
      error: error.message
    });
  }
};