const AvaliacaoEstagio = require("../models/AvaliacaoEstagio");
const RSO = require("../models/RSO");
const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");

const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante a Oficial PM": 7,
  "Aspirante-a-Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

const podeAvaliar = (patente = "") => {
  const ordem = ORDEM_PATENTES[patente] || 999;
  return ordem <= 11;
};

const getReqUserId = (req) => req.user?._id || req.user?.id || null;

const podeGerenciarComoCoordenador = async (reqUser) => {
  const userId = reqUser?._id || reqUser?.id;
  if (!userId) return false;

  const user = await User.findById(userId).lean();
  if (!user) return false;

  if (user.role === "admin" || user.role === "superadmin") {
    return true;
  }

  const hierarchy = await Hierarchy.findOne({ user: user._id }).lean();
  if (!hierarchy) return false;

  return hierarchy.funcao === "Coordenador Operacional";
};

const formatarData = (valor) => {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
};

const formatarHora = (valor) => {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const inicioDoDia = (data = new Date()) => {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
};

const fimDoDia = (data = new Date()) => {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
};

const mesmaDataLocal = (dataA, dataB) => {
  const a = new Date(dataA);
  const b = new Date(dataB);

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const extrairIntegrantesRSO = (rso) => {
  const lista = [];

  if (rso?.equipeFixa?.chefe) lista.push(rso.equipeFixa.chefe);
  if (rso?.equipeFixa?.auxiliar) lista.push(rso.equipeFixa.auxiliar);

  const equipeRotativa = rso?.equipeRotativa || {};

  Object.values(equipeRotativa).forEach((grupo) => {
    if (Array.isArray(grupo)) {
      grupo.forEach((item) => lista.push(item));
    }
  });

  return lista;
};

const integrantePorFuncional = (integrantes = [], funcional) => {
  const funcionalNumero = Number(funcional);

  return integrantes.find((p) => Number(p?.funcional) === funcionalNumero);
};

// ==========================
// USER
// ==========================

exports.listEstagiarios = async (req, res) => {
  try {
    const estagiarios = await User.find({
      categoriaHierarquia: "ESTAGIARIOS",
      status: "Ativo",
      ativo: true
    })
      .select("_id funcional nome patente")
      .sort({ nome: 1 })
      .lean();

    return res.json(estagiarios);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao listar estagiários",
      error: error.message
    });
  }
};

exports.listMyRsos = async (req, res) => {
  try {
    const userId = getReqUserId(req);

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const hojeInicio = inicioDoDia();
    const hojeFim = fimDoDia();

    const rsos = await RSO.find({
      criadoPor: user._id,
      createdAt: {
        $gte: hojeInicio,
        $lte: hojeFim
      }
    })
      .sort({ createdAt: -1 })
      .lean();

    const resultado = rsos
      .map((rso) => {
        const integrantes = extrairIntegrantesRSO(rso);

        const estagiarios = integrantes
          .filter((p) => Number.isFinite(Number(p?.funcional)))
          .map((p) => ({
            funcional: Number(p.funcional),
            nome: p.nome || "",
            patente: p.patente || "",
            cargo: p.cargo || "",
            horaEntrada: p.horaEntrada || null,
            horaSaida: p.horaSaida || null
          }));

        return {
          _id: rso._id,
          viatura: rso.viatura || "",
          status: rso.status || "",
          criadoPor: rso.criadoPor,
          createdAt: rso.createdAt,
          estagiarios
        };
      })
      .filter((rso) => rso.estagiarios.length > 0);

    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao listar RSOs do usuário",
      error: error.message
    });
  }
};

exports.getRsoAutoFill = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const funcional = Number(req.query.funcional);

    if (!funcional) {
      return res.status(400).json({
        message: "Funcional do estagiário é obrigatória."
      });
    }

    const rso = await RSO.findById(req.params.rsoId).lean();

    if (!rso) {
      return res.status(404).json({ message: "RSO não encontrado." });
    }

    if (!mesmaDataLocal(rso.createdAt, new Date())) {
      return res.status(400).json({
        message: "Só é permitido usar RSO do dia atual para autopreenchimento."
      });
    }

    if (String(rso.criadoPor) !== String(userId)) {
      return res.status(403).json({
        message: "Você não tem permissão para usar este RSO."
      });
    }

    const integrantes = extrairIntegrantesRSO(rso);
    const estagiario = integrantePorFuncional(integrantes, funcional);

    if (!estagiario) {
      return res.status(404).json({
        message: "O estagiário selecionado não está presente neste RSO."
      });
    }

    return res.json({
      rsoId: rso._id,
      viatura: rso.viatura || "",
      funcional: estagiario.funcional,
      nome: estagiario.nome || "",
      patente: estagiario.patente || "",
      data: formatarData(estagiario.horaEntrada || rso.createdAt),
      horarioInicial: formatarHora(estagiario.horaEntrada),
      horarioFinal: formatarHora(estagiario.horaSaida)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao carregar dados do RSO",
      error: error.message
    });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const avaliador = await User.findById(userId).lean();

    if (!avaliador) {
      return res.status(404).json({ message: "Usuário avaliador não encontrado." });
    }

    if (!podeAvaliar(avaliador.patente)) {
      return res.status(403).json({
        message: "Somente de 3º Sargento acima pode realizar avaliação de estagiários."
      });
    }

    const {
      estagiarioId,
      rsoId,
      data,
      horarioInicial,
      horarioFinal,
      condutaPatrulha,
      postura,
      proatividade,
      pontosFortes,
      podeMelhorar,
      observacoes
    } = req.body;

    if (!estagiarioId || !data || !horarioInicial || !horarioFinal) {
      return res.status(400).json({
        message: "Estagiário, data, horário inicial e horário final são obrigatórios."
      });
    }

    const estagiario = await User.findById(estagiarioId).lean();

    if (!estagiario) {
      return res.status(404).json({ message: "Estagiário não encontrado." });
    }

    if (estagiario.categoriaHierarquia !== "ESTAGIARIOS") {
      return res.status(400).json({
        message: "O policial selecionado não é estagiário."
      });
    }

    let viatura = "";

    if (rsoId) {
      const rso = await RSO.findById(rsoId).lean();

      if (!rso) {
        return res.status(404).json({ message: "RSO não encontrado." });
      }

      if (!mesmaDataLocal(rso.createdAt, new Date())) {
        return res.status(400).json({
          message: "Só é permitido vincular avaliação a RSO do dia atual."
        });
      }

      if (String(rso.criadoPor) !== String(avaliador._id)) {
        return res.status(403).json({
          message: "Você não pode usar um RSO que não foi aberto por você."
        });
      }

      const integrantes = extrairIntegrantesRSO(rso);
      const estagiarioNoRso = integrantePorFuncional(
        integrantes,
        estagiario.funcional
      );

      if (!estagiarioNoRso) {
        return res.status(400).json({
          message: "O estagiário selecionado não consta neste RSO."
        });
      }

      viatura = rso.viatura || "";
    }

    const created = await AvaliacaoEstagio.create({
      avaliador: {
        userId: avaliador._id,
        funcional: avaliador.funcional,
        nome: avaliador.nome,
        patente: avaliador.patente
      },
      estagiario: {
        userId: estagiario._id,
        funcional: estagiario.funcional,
        nome: estagiario.nome,
        patente: estagiario.patente
      },
      rsoId: rsoId || null,
      viatura,
      data,
      horarioInicial,
      horarioFinal,
      condutaPatrulha: condutaPatrulha || "",
      postura: postura || "",
      proatividade: proatividade || "",
      pontosFortes: pontosFortes || "",
      podeMelhorar: podeMelhorar || "",
      observacoes: observacoes || "",
      historico: [
        {
          acao: "Avaliação criada",
          autorNome: avaliador.nome,
          autorPatente: avaliador.patente,
          data: new Date()
        }
      ]
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao criar avaliação",
      error: error.message
    });
  }
};

exports.listMine = async (req, res) => {
  try {
    const userId = getReqUserId(req);

    const lista = await AvaliacaoEstagio.find({
      "avaliador.userId": userId
    }).sort({ createdAt: -1 });

    return res.json(lista);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao listar avaliações do usuário",
      error: error.message
    });
  }
};

exports.updateMine = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const avaliador = await User.findById(userId).lean();

    if (!avaliador) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const avaliacao = await AvaliacaoEstagio.findOne({
      _id: req.params.id,
      "avaliador.userId": userId
    });

    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada." });
    }

    if (!["Pendente", "Revisao"].includes(avaliacao.status)) {
      return res.status(400).json({
        message: "Essa avaliação não pode mais ser editada."
      });
    }

    const campos = [
      "data",
      "horarioInicial",
      "horarioFinal",
      "condutaPatrulha",
      "postura",
      "proatividade",
      "pontosFortes",
      "podeMelhorar",
      "observacoes"
    ];

    campos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        avaliacao[campo] = req.body[campo];
      }
    });

    avaliacao.status = "Pendente";
    avaliacao.historico.push({
      acao: "Avaliação reenviada/corrigida",
      autorNome: avaliador.nome,
      autorPatente: avaliador.patente,
      data: new Date()
    });

    await avaliacao.save();
    return res.json(avaliacao);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao atualizar avaliação",
      error: error.message
    });
  }
};

exports.deleteMine = async (req, res) => {
  try {
    const userId = getReqUserId(req);

    const deleted = await AvaliacaoEstagio.findOneAndDelete({
      _id: req.params.id,
      "avaliador.userId": userId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Avaliação não encontrada." });
    }

    return res.json({ message: "Avaliação excluída com sucesso." });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao excluir avaliação",
      error: error.message
    });
  }
};

// ==========================
// ADMIN / COORDENADOR
// ==========================

exports.listAdmin = async (req, res) => {
  try {
    const permitido = await podeGerenciarComoCoordenador(req.user);

    if (!permitido) {
      return res.status(403).json({
        message: "Somente o Coordenador Operacional ou administradores podem acessar."
      });
    }

    const lista = await AvaliacaoEstagio.find().sort({ createdAt: -1 });
    return res.json(lista);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao listar avaliações ADM",
      error: error.message
    });
  }
};

exports.validateAdmin = async (req, res) => {
  try {
    const permitido = await podeGerenciarComoCoordenador(req.user);

    if (!permitido) {
      return res.status(403).json({
        message: "Acesso negado."
      });
    }

    const userId = getReqUserId(req);
    const user = await User.findById(userId).lean();
    const avaliacao = await AvaliacaoEstagio.findById(req.params.id);

    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada." });
    }

    avaliacao.status = "Validado";
    avaliacao.comentarioCoordenador = req.body.comentarioCoordenador || "";
    avaliacao.validadoPor = {
      userId: user?._id || null,
      funcional: user?.funcional || 0,
      nome: user?.nome || "",
      patente: user?.patente || ""
    };
    avaliacao.dataValidacao = new Date();

    avaliacao.historico.push({
      acao: "Avaliação validada",
      autorNome: user?.nome || "",
      autorPatente: user?.patente || "",
      comentario: req.body.comentarioCoordenador || "",
      data: new Date()
    });

    await avaliacao.save();
    return res.json(avaliacao);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao validar avaliação",
      error: error.message
    });
  }
};

exports.returnForCorrection = async (req, res) => {
  try {
    const permitido = await podeGerenciarComoCoordenador(req.user);

    if (!permitido) {
      return res.status(403).json({
        message: "Acesso negado."
      });
    }

    const userId = getReqUserId(req);
    const user = await User.findById(userId).lean();
    const avaliacao = await AvaliacaoEstagio.findById(req.params.id);

    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada." });
    }

    avaliacao.status = "Revisao";
    avaliacao.comentarioCoordenador = req.body.comentarioCoordenador || "";
    avaliacao.validadoPor = null;
    avaliacao.dataValidacao = null;

    avaliacao.historico.push({
      acao: "Retornada para correção",
      autorNome: user?.nome || "",
      autorPatente: user?.patente || "",
      comentario: req.body.comentarioCoordenador || "",
      data: new Date()
    });

    await avaliacao.save();
    return res.json(avaliacao);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao retornar avaliação",
      error: error.message
    });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const permitido = await podeGerenciarComoCoordenador(req.user);

    if (!permitido) {
      return res.status(403).json({
        message: "Acesso negado."
      });
    }

    const deleted = await AvaliacaoEstagio.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Avaliação não encontrada." });
    }

    return res.json({ message: "Avaliação excluída com sucesso." });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao excluir avaliação ADM",
      error: error.message
    });
  }
};

exports.clearHistoryAdmin = async (req, res) => {
  try {
    const permitido = await podeGerenciarComoCoordenador(req.user);

    if (!permitido) {
      return res.status(403).json({
        message: "Acesso negado."
      });
    }

    await AvaliacaoEstagio.updateMany({}, { $set: { historico: [] } });

    return res.json({ message: "Históricos zerados com sucesso." });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao zerar históricos",
      error: error.message
    });
  }
};