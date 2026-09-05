const mongoose = require("mongoose");

const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");
const RocamMember = require("../models/RocamMember");
const RocamStage = require("../models/RocamStage");

/* =========================================================
   FUNÇÃO AUXILIAR
========================================================= */

const podeGerenciarRocam = async (req) => {
  if (!req.user) {
    return false;
  }

  /*
    Superadmin sempre pode.
  */
  if (req.user.role === "superadmin") {
    return true;
  }

  const hierarchy = await Hierarchy.findOne({
    user: req.user._id
  }).lean();

  if (!hierarchy) {
    return false;
  }

  /*
    Comando e Subcomando do Batalhão.
  */
  if (
    hierarchy.funcao === "Comando do Batalhão" ||
    hierarchy.funcao === "Subcomando do Batalhão"
  ) {
    return true;
  }

  /*
    Comando ROCAM e Subcomando ROCAM
    vêm do vínculo específico ROCAM.
  */
  const member = await RocamMember.findOne({
    user: req.user._id,
    ativo: true,
    papel: {
      $in: [
        "COMANDO_ROCAM",
        "SUBCOMANDO_ROCAM"
      ]
    }
  }).lean();

  return Boolean(member);
};

/* =========================================================
   LISTAR POLICIAIS ELEGÍVEIS
========================================================= */

exports.listarElegiveis = async (req, res) => {
  try {
    const autorizado = await podeGerenciarRocam(req);

    if (!autorizado) {
      return res.status(403).json({
        message:
          "Você não possui autorização para gerenciar integrantes ROCAM."
      });
    }

    /*
      Descobre quem já possui vínculo ROCAM ativo.
    */
    const membrosAtivos = await RocamMember.find({
      ativo: true
    })
      .select("user")
      .lean();

    const idsAtivos = membrosAtivos.map(
      (item) => item.user
    );

    /*
      Busca somente policiais ativos da hierarquia geral.
    */
    const hierarchy = await Hierarchy.find({
      status: "Ativo",
      user: {
        $ne: null,
        $nin: idsAtivos
      }
    })
      .select(
        "user funcional nome patente categoria funcao status"
      )
      .lean();

    const lista = hierarchy
      .filter((item) => item.user)
      .map((item) => ({
        _id: item._id,

        user: item.user,

        funcional: item.funcional,

        nome: item.nome,

        patente: item.patente,

        categoria: item.categoria,

        funcao: item.funcao,

        status: item.status
      }))
      .sort((a, b) =>
        String(a.nome || "").localeCompare(
          String(b.nome || ""),
          "pt-BR"
        )
      );

    return res.json(lista);
  } catch (err) {
    console.error(
      "Erro listar elegíveis ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar policiais elegíveis para ROCAM."
    });
  }
};

/* =========================================================
   CADASTRAR NOVO ESTAGIÁRIO
========================================================= */

exports.cadastrarEstagiario = async (req, res) => {
  const session =
    await mongoose.startSession();

  try {
    const autorizado =
      await podeGerenciarRocam(req);

    if (!autorizado) {
      return res.status(403).json({
        message:
          "Você não possui autorização para cadastrar estagiários ROCAM."
      });
    }

    const {
      userId,
      dataEntradaRocam,
      metas,
      criteriosAvaliacao,
      questionarios,
      observacoes
    } = req.body;

    /* =====================================================
       VALIDAÇÃO
    ===================================================== */

    if (!userId) {
      return res.status(400).json({
        message:
          "Policial não informado."
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return res.status(400).json({
        message:
          "Identificação do policial inválida."
      });
    }

    if (!dataEntradaRocam) {
      return res.status(400).json({
        message:
          "Informe a data de ingresso na ROCAM."
      });
    }

    const dataEntrada =
      new Date(dataEntradaRocam);

    if (
      Number.isNaN(
        dataEntrada.getTime()
      )
    ) {
      return res.status(400).json({
        message:
          "Data de ingresso inválida."
      });
    }

    const horas =
      Number(
        metas?.horasPatrulhamento || 0
      );

    const quantidadeAvaliacoes =
      Number(
        metas?.quantidadeAvaliacoes || 0
      );

    const notaAvaliacoes =
      Number(
        metas?.notaMinimaAvaliacoes ?? 70
      );

    const exigirQuestionarios =
      Boolean(
        metas?.exigirQuestionarios
      );

    const notaQuestionarios =
      Number(
        metas?.notaMinimaQuestionarios ?? 70
      );

    if (
      horas < 0 ||
      quantidadeAvaliacoes < 0
    ) {
      return res.status(400).json({
        message:
          "As metas não podem possuir valores negativos."
      });
    }

    if (
      notaAvaliacoes < 0 ||
      notaAvaliacoes > 100
    ) {
      return res.status(400).json({
        message:
          "A nota mínima das avaliações deve estar entre 0 e 100."
      });
    }

    if (
      notaQuestionarios < 0 ||
      notaQuestionarios > 100
    ) {
      return res.status(400).json({
        message:
          "A nota mínima dos questionários deve estar entre 0 e 100."
      });
    }

    if (
      !Array.isArray(
        criteriosAvaliacao
      ) ||
      criteriosAvaliacao.length === 0
    ) {
      return res.status(400).json({
        message:
          "Selecione pelo menos um critério de avaliação."
      });
    }

    if (
      exigirQuestionarios &&
      (
        !Array.isArray(
          questionarios
        ) ||
        questionarios.length === 0
      )
    ) {
      return res.status(400).json({
        message:
          "Selecione pelo menos um questionário."
      });
    }

    /* =====================================================
       BUSCA USUÁRIO/HIERARQUIA
    ===================================================== */

    const user =
      await User.findById(
        userId
      ).lean();

    if (!user) {
      return res.status(404).json({
        message:
          "Usuário não encontrado."
      });
    }

    if (user.ativo === false) {
      return res.status(400).json({
        message:
          "O usuário informado está inativo."
      });
    }

    const hierarchy =
      await Hierarchy.findOne({
        user: user._id
      });

    if (!hierarchy) {
      return res.status(404).json({
        message:
          "O policial não possui registro na hierarquia geral."
      });
    }

    if (
      hierarchy.status !== "Ativo"
    ) {
      return res.status(400).json({
        message:
          "Somente policiais ativos podem ingressar na ROCAM."
      });
    }

    /* =====================================================
       VERIFICA VÍNCULO ATIVO
    ===================================================== */

    const vinculoAtivo =
      await RocamMember.findOne({
        user: user._id,
        ativo: true
      }).lean();

    if (vinculoAtivo) {
      return res.status(400).json({
        message:
          "Este policial já possui vínculo ativo com a ROCAM."
      });
    }

    /* =====================================================
       TRANSAÇÃO
    ===================================================== */

    session.startTransaction();

    const [member] =
      await RocamMember.create(
        [
          {
            user: user._id,

            hierarchy:
              hierarchy._id,

            funcional:
              hierarchy.funcional,

            nome:
              hierarchy.nome,

            patente:
              hierarchy.patente,

            papel:
              "ESTAGIARIO_ROCAM",

            ativo: true,

            dataEntrada
          }
        ],
        {
          session
        }
      );

    const [stage] =
      await RocamStage.create(
        [
          {
            member:
              member._id,

            user:
              user._id,

            status:
              "EM_ANDAMENTO",

            dataInicio:
              dataEntrada,

            metas: {
              horasPatrulhamento:
                horas,

              quantidadeAvaliacoes,

              notaMinimaAvaliacoes:
                notaAvaliacoes,

              exigirQuestionarios,

              notaMinimaQuestionarios:
                exigirQuestionarios
                  ? notaQuestionarios
                  : 0
            },

            criteriosAvaliacao:
              criteriosAvaliacao,

            questionarios:
              exigirQuestionarios
                ? questionarios
                : [],

            observacoes:
              String(
                observacoes || ""
              ).trim(),

            criadoPor:
              req.user._id
          }
        ],
        {
          session
        }
      );

    /*
      Mantém compatibilidade com o campo que
      você já adicionou na Hierarchy.

      Isso NÃO altera categoria, função,
      patente ou status da hierarquia geral.
    */
    hierarchy.qualificacaoRocam =
      "ESTAGIARIO_ROCAM";

    await hierarchy.save({
      session
    });

    await session.commitTransaction();

    return res.status(201).json({
      message:
        "Estagiário ROCAM cadastrado com sucesso.",

      member,
      stage
    });
  } catch (err) {
    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.error(
      "Erro cadastrar estagiário ROCAM:",
      err
    );

    /*
      Proteção extra para índice único.
    */
    if (err?.code === 11000) {
      return res.status(400).json({
        message:
          "Este policial já possui vínculo ativo com a ROCAM."
      });
    }

    return res.status(500).json({
      message:
        "Erro ao cadastrar estagiário ROCAM."
    });
  } finally {
    await session.endSession();
  }
};

/* =========================================================
   LISTAR ESTAGIÁRIOS
========================================================= */

exports.listarEstagiarios = async (
  req,
  res
) => {
  try {
    const autorizado =
      await podeGerenciarRocam(req);

    if (!autorizado) {
      return res.status(403).json({
        message:
          "Acesso não autorizado."
      });
    }

    const membros =
      await RocamMember.find({
        papel:
          "ESTAGIARIO_ROCAM",
        ativo: true
      })
        .sort({
          dataEntrada: 1
        })
        .lean();

    const resultado =
      await Promise.all(
        membros.map(
          async (member) => {
            const stage =
              await RocamStage.findOne({
                member:
                  member._id,
                status: {
                  $in: [
                    "EM_ANDAMENTO",
                    "APTO_APROVACAO"
                  ]
                }
              })
                .sort({
                  createdAt: -1
                })
                .lean();

            return {
              ...member,
              stage
            };
          }
        )
      );

    return res.json(
      resultado
    );
  } catch (err) {
    console.error(
      "Erro listar estagiários ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar estagiários ROCAM."
    });
  }
};