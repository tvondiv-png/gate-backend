const User = require("../models/User");
const RocamProfile = require("../models/RocamProfile");
const RocamStage = require("../models/RocamStage");
const RocamEvaluation = require("../models/RocamEvaluation");

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const STATUS_ESTAGIO_ABERTO = [
  "EM_ANDAMENTO",
  "APTO_APROVACAO",
  "APROVACAO_SOLICITADA"
];

/* =========================================================
   AUXILIAR — VERIFICAR QUEM PODE AVALIAR
========================================================= */

function podeAvaliar(req) {
  /*
    Superadmin pode entrar para testes/supervisão.
  */
  if (
    req.user?.role === "superadmin"
  ) {
    return true;
  }

  return (
    req.rocamProfile?.ativo === true &&
    req.rocamProfile?.papelRocam ===
      "BRACAL_ROCAM"
  );
}

/* =========================================================
   NORMALIZAR CRITÉRIOS
========================================================= */

function normalizarCriterios(
  criterios = []
) {
  if (!Array.isArray(criterios)) {
    return [];
  }

  return criterios.map(
    (criterio, index) => {
      /*
        Caso no estágio tenha sido salvo
        somente "pilotagem", "postura", etc.
      */
      if (
        typeof criterio === "string"
      ) {
        return {
          codigo: criterio,
          label: criterio
            .replace(/_/g, " ")
            .replace(
              /\b\w/g,
              (letra) =>
                letra.toUpperCase()
            )
        };
      }

      return {
        codigo:
          criterio.codigo ||
          criterio.chave ||
          `CRITERIO_${index + 1}`,

        label:
          criterio.label ||
          criterio.nome ||
          criterio.codigo ||
          criterio.chave ||
          `Critério ${index + 1}`
      };
    }
  );
}

/* =========================================================
   LISTAR ESTAGIÁRIOS DISPONÍVEIS PARA AVALIAÇÃO
========================================================= */

exports.listTraineesForEvaluation = async (
  req,
  res
) => {
  try {
    if (!podeAvaliar(req)) {
      return res.status(403).json({
        message:
          "Apenas Braçais ROCAM podem realizar avaliações."
      });
    }

    const profiles =
      await RocamProfile.find({
        ativo: true,
        papelRocam:
          "ESTAGIARIO_ROCAM"
      })
        .sort({
          nome: 1
        })
        .lean();

    if (!profiles.length) {
      return res.json([]);
    }

    const userIds =
      profiles.map(
        (item) => item.user
      );

    const stages =
      await RocamStage.find({
        user: {
          $in: userIds
        },

        status: {
          $in:
            STATUS_ESTAGIO_ABERTO
        }
      })
        .sort({
          createdAt: -1
        })
        .lean();

    const stageMap =
      new Map();

    stages.forEach(
      (stage) => {
        const key =
          String(stage.user);

        if (!stageMap.has(key)) {
          stageMap.set(
            key,
            stage
          );
        }
      }
    );

    const resultado =
      profiles
        .map((profile) => {
          const stage =
            stageMap.get(
              String(profile.user)
            );

          if (!stage) {
            return null;
          }

          return {
            user:
              profile.user,

            profileId:
              profile._id,

            funcional:
              profile.funcional,

            nome:
              profile.nome,

            patente:
              profile.patente,

            dataIngressoRocam:
              profile.dataIngressoRocam,

            situacaoRocam:
              profile.situacaoRocam,

            stageId:
              stage._id,

            statusEstagio:
              stage.status,

            criteriosAvaliacao:
              normalizarCriterios(
                stage.criteriosAvaliacao
              )
          };
        })
        .filter(Boolean);

    return res.json(
      resultado
    );
  } catch (err) {
    console.error(
      "Erro listTraineesForEvaluation:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar Estagiários ROCAM"
    });
  }
};

/* =========================================================
   CARREGAR ESTAGIÁRIO PARA AVALIAÇÃO
========================================================= */

exports.getTraineeForEvaluation = async (
  req,
  res
) => {
  try {
    if (!podeAvaliar(req)) {
      return res.status(403).json({
        message:
          "Apenas Braçais ROCAM podem realizar avaliações."
      });
    }

    const profile =
      await RocamProfile.findOne({
        user:
          req.params.userId,

        ativo: true,

        papelRocam:
          "ESTAGIARIO_ROCAM"
      }).lean();

    if (!profile) {
      return res.status(404).json({
        message:
          "Estagiário ROCAM não encontrado"
      });
    }

    const stage =
      await RocamStage.findOne({
        user:
          profile.user,

        status: {
          $in:
            STATUS_ESTAGIO_ABERTO
        }
      })
        .sort({
          createdAt: -1
        })
        .lean();

    if (!stage) {
      return res.status(404).json({
        message:
          "Estágio ROCAM ativo não encontrado"
      });
    }

    /*
      Histórico recente de avaliações
      para o Braçal ter contexto.
    */
    const ultimasAvaliacoes =
      await RocamEvaluation.find({
        traineeUser:
          profile.user
      })
        .select(
          "notaPercentual status dataAvaliacao nomeAvaliador"
        )
        .sort({
          dataAvaliacao: -1
        })
        .limit(5)
        .lean();

    return res.json({
      profile,

      stage: {
        _id:
          stage._id,

        status:
          stage.status,

        dataInicio:
          stage.dataInicio,

        criteriosAvaliacao:
          normalizarCriterios(
            stage.criteriosAvaliacao
          )
      },

      ultimasAvaliacoes
    });
  } catch (err) {
    console.error(
      "Erro getTraineeForEvaluation:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar avaliação ROCAM"
    });
  }
};

/* =========================================================
   ENVIAR AVALIAÇÃO
========================================================= */

exports.createEvaluation = async (
  req,
  res
) => {
  try {
    if (!podeAvaliar(req)) {
      return res.status(403).json({
        message:
          "Apenas Braçais ROCAM podem realizar avaliações."
      });
    }

    const {
      criterios,
      comentarioBracal
    } = req.body;

    /* -----------------------------------------------------
       ESTAGIÁRIO
    ----------------------------------------------------- */

    const profile =
      await RocamProfile.findOne({
        user:
          req.params.userId,

        ativo: true,

        papelRocam:
          "ESTAGIARIO_ROCAM"
      });

    if (!profile) {
      return res.status(404).json({
        message:
          "Estagiário ROCAM não encontrado"
      });
    }

    const stage =
      await RocamStage.findOne({
        user:
          profile.user,

        status: {
          $in:
            STATUS_ESTAGIO_ABERTO
        }
      })
        .sort({
          createdAt: -1
        });

    if (!stage) {
      return res.status(404).json({
        message:
          "Estágio ROCAM ativo não encontrado"
      });
    }

    /* -----------------------------------------------------
       CRITÉRIOS DEFINIDOS NO ESTÁGIO
    ----------------------------------------------------- */

    const criteriosObrigatorios =
      normalizarCriterios(
        stage.criteriosAvaliacao
      );

    if (!criteriosObrigatorios.length) {
      return res.status(400).json({
        message:
          "Este estágio não possui critérios de avaliação."
      });
    }

    if (
      !Array.isArray(criterios)
    ) {
      return res.status(400).json({
        message:
          "Critérios da avaliação não informados."
      });
    }

    /* -----------------------------------------------------
       VALIDAR RESPOSTAS
    ----------------------------------------------------- */

    const respostasMap =
      new Map(
        criterios.map(
          (item) => [
            String(item.codigo),
            item
          ]
        )
      );

    const criteriosFinal =
      [];

    for (
      const criterio of
      criteriosObrigatorios
    ) {
      const resposta =
        respostasMap.get(
          String(
            criterio.codigo
          )
        );

      if (
        !resposta ||
        ![
          "ATENDE",
          "NAO_ATENDE"
        ].includes(
          resposta.resposta
        )
      ) {
        return res.status(400).json({
          message:
            `Responda o critério: ${criterio.label}`
        });
      }

      criteriosFinal.push({
        codigo:
          criterio.codigo,

        label:
          criterio.label,

        resposta:
          resposta.resposta,

        comentario:
          String(
            resposta.comentario ||
              ""
          ).trim()
      });
    }

    /* -----------------------------------------------------
       NOTA
    ----------------------------------------------------- */

    const totalCriterios =
      criteriosFinal.length;

    const totalAtende =
      criteriosFinal.filter(
        (item) =>
          item.resposta ===
          "ATENDE"
      ).length;

    const totalNaoAtende =
      totalCriterios -
      totalAtende;

    const notaPercentual =
      totalCriterios > 0
        ? Number(
            (
              (
                totalAtende /
                totalCriterios
              ) *
              100
            ).toFixed(2)
          )
        : 0;

    /* -----------------------------------------------------
       AVALIADOR
    ----------------------------------------------------- */

    const avaliador =
      await User.findById(
        req.user.id
      ).lean();

    if (!avaliador) {
      return res.status(404).json({
        message:
          "Avaliador não encontrado"
      });
    }

    let profileAvaliador =
      req.rocamProfile;

    /*
      Superadmin entra sem RocamProfile.
    */
    if (
      !profileAvaliador &&
      req.user.role !==
        "superadmin"
    ) {
      profileAvaliador =
        await RocamProfile.findOne({
          user:
            avaliador._id,

          ativo: true
        }).lean();
    }

    /* -----------------------------------------------------
       CRIA AVALIAÇÃO
    ----------------------------------------------------- */

    const avaliacao =
      await RocamEvaluation.create({
        traineeUser:
          profile.user,

        traineeProfile:
          profile._id,

        stage:
          stage._id,

        funcionalEstagiario:
          profile.funcional,

        nomeEstagiario:
          profile.nome,

        patenteEstagiario:
          profile.patente,

        evaluatorUser:
          avaliador._id,

        evaluatorProfile:
          profileAvaliador?._id ||
          null,

        funcionalAvaliador:
          avaliador.funcional,

        nomeAvaliador:
          avaliador.nome,

        criterios:
          criteriosFinal,

        totalCriterios,

        totalAtende,

        totalNaoAtende,

        notaPercentual,

        comentarioBracal:
          String(
            comentarioBracal ||
              ""
          ).trim(),

        status:
          "PENDENTE_COMANDO",

        dataAvaliacao:
          new Date()
      });

    /*
      NÃO atualizamos o progresso do estágio aqui.

      Isso será feito somente quando
      o Comando ROCAM validar.
    */

    return res.status(201).json({
      message:
        "Avaliação enviada ao Comando ROCAM com sucesso",

      avaliacao
    });
  } catch (err) {
    console.error(
      "Erro createEvaluation ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao registrar avaliação ROCAM"
    });
  }
};

/* =========================================================
   LISTAR AVALIAÇÕES PARA O COMANDO
========================================================= */

exports.listEvaluationsForCommand = async (
  req,
  res
) => {
  try {
    const status =
      String(
        req.query.status ||
          "PENDENTE_COMANDO"
      ).trim();

    const filtro = {};

    if (
      status &&
      status !== "TODAS"
    ) {
      filtro.status =
        status;
    }

    const avaliacoes =
      await RocamEvaluation.find(
        filtro
      )
        .populate(
          "traineeUser",
          "nome funcional"
        )
        .populate(
          "evaluatorUser",
          "nome funcional"
        )
        .populate(
          "analisadaPor",
          "nome funcional"
        )
        .sort({
          createdAt: -1
        })
        .lean();

    return res.json(
      avaliacoes
    );
  } catch (err) {
    console.error(
      "Erro listEvaluationsForCommand:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar avaliações ROCAM"
    });
  }
};

/* =========================================================
   VALIDAR AVALIAÇÃO
========================================================= */

exports.validateEvaluation = async (
  req,
  res
) => {
  try {
    const {
      comentarioComando
    } = req.body;

    const avaliacao =
      await RocamEvaluation.findById(
        req.params.id
      );

    if (!avaliacao) {
      return res.status(404).json({
        message:
          "Avaliação ROCAM não encontrada"
      });
    }

    if (
      avaliacao.status !==
      "PENDENTE_COMANDO"
    ) {
      return res.status(409).json({
        message:
          "Esta avaliação já foi analisada"
      });
    }

    avaliacao.status =
      "VALIDADA";

    avaliacao.comentarioComando =
      String(
        comentarioComando ||
          ""
      ).trim();

    avaliacao.analisadaPor =
      req.user.id;

    avaliacao.analisadaEm =
      new Date();

    await avaliacao.save();

    /* =====================================================
       RECALCULAR PROGRESSO DO ESTÁGIO
    ===================================================== */

    const stage =
      await RocamStage.findById(
        avaliacao.stage
      );

    if (stage) {
      const validadas =
        await RocamEvaluation.find({
          stage:
            stage._id,

          status:
            "VALIDADA"
        })
          .select(
            "notaPercentual"
          )
          .lean();

      const total =
        validadas.length;

      const soma =
        validadas.reduce(
          (
            acc,
            item
          ) =>
            acc +
            Number(
              item.notaPercentual ||
                0
            ),
          0
        );

      const media =
        total > 0
          ? Number(
              (
                soma /
                total
              ).toFixed(2)
            )
          : 0;

      if (!stage.progresso) {
        stage.progresso = {};
      }

      stage.progresso.avaliacoesRealizadas =
        total;

      stage.progresso.mediaAvaliacoes =
        media;

      await stage.save();
    }

    return res.json({
      message:
        "Avaliação validada com sucesso",

      avaliacao
    });
  } catch (err) {
    console.error(
      "Erro validateEvaluation:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao validar avaliação ROCAM"
    });
  }
};

/* =========================================================
   DEVOLVER AVALIAÇÃO
========================================================= */

exports.returnEvaluation = async (
  req,
  res
) => {
  try {
    const {
      comentarioComando
    } = req.body;

    if (
      !comentarioComando ||
      !String(
        comentarioComando
      ).trim()
    ) {
      return res.status(400).json({
        message:
          "Informe o motivo da devolução"
      });
    }

    const avaliacao =
      await RocamEvaluation.findById(
        req.params.id
      );

    if (!avaliacao) {
      return res.status(404).json({
        message:
          "Avaliação ROCAM não encontrada"
      });
    }

    if (
      avaliacao.status !==
      "PENDENTE_COMANDO"
    ) {
      return res.status(409).json({
        message:
          "Esta avaliação já foi analisada"
      });
    }

    avaliacao.status =
      "DEVOLVIDA";

    avaliacao.comentarioComando =
      String(
        comentarioComando
      ).trim();

    avaliacao.analisadaPor =
      req.user.id;

    avaliacao.analisadaEm =
      new Date();

    await avaliacao.save();

    return res.json({
      message:
        "Avaliação devolvida ao Braçal ROCAM",

      avaliacao
    });
  } catch (err) {
    console.error(
      "Erro returnEvaluation:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao devolver avaliação ROCAM"
    });
  }
};