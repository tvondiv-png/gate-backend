const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");

const RocamProfile = require("../models/RocamProfile");
const RocamStage = require("../models/RocamStage");
const RocamHistory = require("../models/RocamHistory");

/* =========================================================
   HELPERS — METAS ROCAM
========================================================= */

function valorMeta(metas, chave, campo = "valor") {
  const meta = metas?.[chave];

  if (!meta) {
    return 0;
  }

  if (meta.habilitada === false) {
    return 0;
  }

  return Number(
    meta?.[campo] || 0
  );
}

function valorProgresso(
  progresso,
  chaves = []
) {
  for (const chave of chaves) {
    if (
      progresso?.[chave] !== undefined
    ) {
      return Number(
        progresso[chave] || 0
      );
    }
  }

  return 0;
}

function percentualMeta(
  atual,
  meta
) {
  const a =
    Number(atual || 0);

  const m =
    Number(meta || 0);

  if (m <= 0) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (a / m) * 100
    )
  );
}

function calcularSituacaoEstagio(stage) {
  const metas =
    stage?.metas || {};

  const progresso =
    stage?.progresso || {};

  const criterios = [];

  const metaHoras =
    valorMeta(
      metas,
      "horasPatrulhamento"
    );

  const horas =
    valorProgresso(
      progresso,
      [
        "horasCumpridas",
        "horasPatrulhamento",
        "horasRealizadas"
      ]
    );

  if (metaHoras > 0) {
    criterios.push({
      codigo: "HORAS",
      titulo:
        "Horas de patrulhamento",
      atual: horas,
      meta: metaHoras,
      percentual:
        percentualMeta(
          horas,
          metaHoras
        ),
      cumprida:
        horas >= metaHoras
    });
  }

  const metaPatrulhas =
    valorMeta(
      metas,
      "quantidadePatrulhas"
    );

  const patrulhas =
    valorProgresso(
      progresso,
      [
        "patrulhasRealizadas",
        "quantidadePatrulhas"
      ]
    );

  if (metaPatrulhas > 0) {
    criterios.push({
      codigo: "PATRULHAS",
      titulo: "Patrulhas ROCAM",
      atual: patrulhas,
      meta: metaPatrulhas,
      percentual:
        percentualMeta(
          patrulhas,
          metaPatrulhas
        ),
      cumprida:
        patrulhas >=
        metaPatrulhas
    });
  }

  const metaAvaliacoes =
    valorMeta(
      metas,
      "quantidadeAvaliacoes"
    );

  const avaliacoes =
    valorProgresso(
      progresso,
      [
        "avaliacoesRealizadas",
        "quantidadeAvaliacoes",
        "totalAvaliacoes"
      ]
    );

  if (metaAvaliacoes > 0) {
    criterios.push({
      codigo: "AVALIACOES",
      titulo: "Avaliações",
      atual: avaliacoes,
      meta: metaAvaliacoes,
      percentual:
        percentualMeta(
          avaliacoes,
          metaAvaliacoes
        ),
      cumprida:
        avaliacoes >=
        metaAvaliacoes
    });
  }

  const metaMedia =
    valorMeta(
      metas,
      "mediaMinimaAvaliacoes"
    );

  const media =
    valorProgresso(
      progresso,
      [
        "mediaAvaliacoes",
        "mediaAvaliacao"
      ]
    );

  if (metaMedia > 0) {
    criterios.push({
      codigo:
        "MEDIA_AVALIACOES",
      titulo:
        "Média das avaliações",
      atual: media,
      meta: metaMedia,
      percentual:
        percentualMeta(
          media,
          metaMedia
        ),
      cumprida:
        media >= metaMedia
    });
  }

  const metaQuestionarios =
    valorMeta(
      metas,
      "quantidadeQuestionarios"
    );

  const questionarios =
    valorProgresso(
      progresso,
      [
        "questionariosConcluidos",
        "quantidadeQuestionarios",
        "totalQuestionarios"
      ]
    );

  if (metaQuestionarios > 0) {
    criterios.push({
      codigo: "QUESTIONARIOS",
      titulo: "Questionários",
      atual: questionarios,
      meta: metaQuestionarios,
      percentual:
        percentualMeta(
          questionarios,
          metaQuestionarios
        ),
      cumprida:
        questionarios >=
        metaQuestionarios
    });
  }

  const metaAproveitamento =
    valorMeta(
      metas,
      "aproveitamentoQuestionarios"
    );

  const aproveitamento =
    valorProgresso(
      progresso,
      [
        "mediaQuestionarios",
        "aproveitamentoQuestionarios"
      ]
    );

  if (metaAproveitamento > 0) {
    criterios.push({
      codigo:
        "APROVEITAMENTO",
      titulo:
        "Aproveitamento dos questionários",
      atual: aproveitamento,
      meta: metaAproveitamento,
      percentual:
        percentualMeta(
          aproveitamento,
          metaAproveitamento
        ),
      cumprida:
        aproveitamento >=
        metaAproveitamento
    });
  }

  const controleAusencias =
    metas?.ausenciasInjustificadas &&
    metas?.ausenciasInjustificadas
      ?.habilitada !== false;

  const metaAusencias =
    valorMeta(
      metas,
      "ausenciasInjustificadas",
      "maximo"
    );

  const ausencias =
    valorProgresso(
      progresso,
      [
        "ausenciasInjustificadas",
        "totalAusenciasInjustificadas"
      ]
    );

  if (controleAusencias) {
    criterios.push({
      codigo: "AUSENCIAS",
      titulo:
        "Ausências injustificadas",
      atual: ausencias,
      meta: metaAusencias,
      percentual:
        ausencias <=
        metaAusencias
          ? 100
          : 0,
      cumprida:
        ausencias <=
        metaAusencias
    });
  }

  const percentualGeral =
    criterios.length
      ? Number(
          (
            criterios.reduce(
              (
                soma,
                criterio
              ) =>
                soma +
                Number(
                  criterio.percentual ||
                    0
                ),
              0
            ) /
            criterios.length
          ).toFixed(2)
        )
      : 0;

  const apto =
    criterios.length > 0 &&
    criterios.every(
      (criterio) =>
        criterio.cumprida
    );

  return {
    apto,
    percentualGeral,
    criterios
  };
}

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const PAPEIS_VALIDOS = [
  "COMANDO_ROCAM",
  "SUBCOMANDO_ROCAM",
  "BRACAL_ROCAM",
  "ESTAGIARIO_ROCAM"
];

const STATUS_ESTAGIO_ABERTO = [
  "EM_ANDAMENTO",
  "APTO_APROVACAO",
  "APROVACAO_SOLICITADA"
];

const CRITERIOS_PADRAO = [
  {
    codigo: "FARDAMENTO",
    label: "Fardamento",
    obrigatorio: true
  },
  {
    codigo: "POSTURA",
    label: "Postura",
    obrigatorio: true
  },
  {
    codigo: "PILOTAGEM",
    label: "Pilotagem",
    obrigatorio: true
  },
  {
    codigo: "ACOMPANHAMENTO",
    label: "Acompanhamento",
    obrigatorio: true
  },
  {
    codigo: "SEGURANCA",
    label: "Segurança",
    obrigatorio: true
  },
  {
    codigo: "TECNICA_ROCAM",
    label: "Técnica ROCAM",
    obrigatorio: true
  },
  {
    codigo: "COMUNICACAO",
    label: "Comunicação",
    obrigatorio: true
  },
  {
    codigo: "DISCIPLINA",
    label: "Disciplina",
    obrigatorio: true
  },
  {
    codigo: "PROCEDIMENTOS",
    label: "Procedimentos",
    obrigatorio: true
  },
  {
    codigo: "TRABALHO_EQUIPE",
    label: "Trabalho em equipe",
    obrigatorio: true
  }
];

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function numeroSeguro(valor, padrao = 0) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : padrao;
}

function dataValidaOuAgora(valor) {
  if (!valor) {
    return new Date();
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return new Date();
  }

  return data;
}

/* =========================================================
   USUÁRIOS DISPONÍVEIS
========================================================= */

exports.listEligiblePolice = async (req, res) => {
  try {
    const hierarchy = await Hierarchy.find({
      status: "Ativo",
      user: {
        $ne: null
      }
    })
      .sort({
        funcional: 1
      })
      .lean();

    const userIds = hierarchy
      .map((item) => item.user)
      .filter(Boolean);

    const profiles = await RocamProfile.find({
      user: {
        $in: userIds
      },
      ativo: true
    })
      .select(
        "user papelRocam situacaoRocam ativo"
      )
      .lean();

    const ativos = new Map(
      profiles.map((item) => [
        String(item.user),
        item
      ])
    );

    const lista = hierarchy.map((item) => {
      const profile =
        ativos.get(
          String(item.user)
        ) || null;

      return {
        _id: item._id,

        user: item.user,

        funcional:
          item.funcional,

        nome:
          item.nome,

        patente:
          item.patente,

        categoria:
          item.categoria,

        funcao:
          item.funcao,

        qualificacaoRocam:
          item.qualificacaoRocam ||
          "NENHUM",

        rocamAtivo:
          Boolean(profile),

        papelRocam:
          profile?.papelRocam ||
          null,

        situacaoRocam:
          profile?.situacaoRocam ||
          null
      };
    });

    return res.json(lista);
  } catch (err) {
    console.error(
      "Erro ao listar elegíveis ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao listar policiais"
    });
  }
};

/* =========================================================
   CADASTRAR NOVO ESTAGIÁRIO
========================================================= */

exports.createTrainee = async (req, res) => {
  try {
    const {
      userId,
      dataIngresso,
      metas,
      criteriosAvaliacao
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message:
          "Selecione um policial"
      });
    }

    /* -----------------------------------------------------
       HIERARQUIA GERAL
    ----------------------------------------------------- */

    const hierarchy = await Hierarchy.findOne({
      user: userId,
      status: "Ativo"
    });

    if (!hierarchy) {
      return res.status(404).json({
        message:
          "Policial não encontrado na hierarquia ativa"
      });
    }

    /* -----------------------------------------------------
       USER
    ----------------------------------------------------- */

    const user = await User.findById(
      hierarchy.user
    );

    if (!user) {
      return res.status(404).json({
        message:
          "Usuário não encontrado"
      });
    }

    /* -----------------------------------------------------
       VERIFICA SE JÁ EXISTE ESTÁGIO ABERTO

       IMPORTANTE:
       isso acontece ANTES de alterar o RocamProfile.
    ----------------------------------------------------- */

    const stageAberto =
      await RocamStage.findOne({
        user: user._id,

        status: {
          $in: STATUS_ESTAGIO_ABERTO
        }
      });

    if (stageAberto) {
      return res.status(409).json({
        message:
          "Este policial já possui estágio ROCAM em andamento"
      });
    }

    /* -----------------------------------------------------
       PERFIL ROCAM
    ----------------------------------------------------- */

    let profile =
      await RocamProfile.findOne({
        user: user._id
      });

    if (profile?.ativo) {
      return res.status(409).json({
        message:
          "Este policial já possui vínculo ROCAM ativo"
      });
    }

    const ingresso =
      dataValidaOuAgora(
        dataIngresso
      );

    if (!profile) {
      profile =
        await RocamProfile.create({
          user:
            user._id,

          hierarchy:
            hierarchy._id,

          funcional:
            hierarchy.funcional,

          nome:
            hierarchy.nome,

          patente:
            hierarchy.patente,

          papelRocam:
            "ESTAGIARIO_ROCAM",

          situacaoRocam:
            "EM_ESTAGIO",

          ativo:
            true,

          dataIngressoRocam:
            ingresso,

          dataSaidaRocam:
            null,

          motivoSaida:
            "",

          boletimSaida:
            "",

          cadastradoPor:
            req.user.id,

          atualizadoPor:
            req.user.id
        });
    } else {
      profile.hierarchy =
        hierarchy._id;

      profile.funcional =
        hierarchy.funcional;

      profile.nome =
        hierarchy.nome;

      profile.patente =
        hierarchy.patente;

      profile.papelRocam =
        "ESTAGIARIO_ROCAM";

      profile.situacaoRocam =
        "EM_ESTAGIO";

      profile.ativo =
        true;

      profile.dataIngressoRocam =
        ingresso;

      profile.dataSaidaRocam =
        null;

      profile.motivoSaida =
        "";

      profile.boletimSaida =
        "";

      profile.atualizadoPor =
        req.user.id;

      await profile.save();
    }

    /* -----------------------------------------------------
       METAS DO ESTÁGIO
    ----------------------------------------------------- */

    const metasStage = {
      horasPatrulhamento: {
        habilitada:
          metas
            ?.horasPatrulhamento
            ?.habilitada ??
          true,

        valor:
          numeroSeguro(
            metas
              ?.horasPatrulhamento
              ?.valor,
            60
          )
      },

      quantidadePatrulhas: {
        habilitada:
          metas
            ?.quantidadePatrulhas
            ?.habilitada ??
          true,

        valor:
          numeroSeguro(
            metas
              ?.quantidadePatrulhas
              ?.valor,
            20
          )
      },

      quantidadeAvaliacoes: {
        habilitada:
          metas
            ?.quantidadeAvaliacoes
            ?.habilitada ??
          true,

        valor:
          numeroSeguro(
            metas
              ?.quantidadeAvaliacoes
              ?.valor,
            10
          )
      },

      mediaMinimaAvaliacoes: {
        habilitada:
          metas
            ?.mediaMinimaAvaliacoes
            ?.habilitada ??
          true,

        valor:
          numeroSeguro(
            metas
              ?.mediaMinimaAvaliacoes
              ?.valor,
            80
          )
      },

      quantidadeQuestionarios: {
        habilitada:
          metas
            ?.quantidadeQuestionarios
            ?.habilitada ??
          true,

        valor:
          numeroSeguro(
            metas
              ?.quantidadeQuestionarios
              ?.valor,
            4
          )
      },

      aproveitamentoQuestionarios: {
        habilitada:
          metas
            ?.aproveitamentoQuestionarios
            ?.habilitada ??
          true,

        valor:
          numeroSeguro(
            metas
              ?.aproveitamentoQuestionarios
              ?.valor,
            70
          )
      },

      ausenciasInjustificadas: {
        habilitada:
          metas
            ?.ausenciasInjustificadas
            ?.habilitada ??
          true,

        maximo:
          numeroSeguro(
            metas
              ?.ausenciasInjustificadas
              ?.maximo,
            0
          )
      }
    };

    /* -----------------------------------------------------
       CRITÉRIOS DE AVALIAÇÃO
    ----------------------------------------------------- */

    const criterios =
      Array.isArray(
        criteriosAvaliacao
      ) &&
      criteriosAvaliacao.length
        ? criteriosAvaliacao
        : CRITERIOS_PADRAO;

    /* -----------------------------------------------------
       CRIA ESTÁGIO
    ----------------------------------------------------- */

    let stage;

    try {
      stage =
        await RocamStage.create({
          user:
            user._id,

          profile:
            profile._id,

          funcional:
            hierarchy.funcional,

          dataInicio:
            ingresso,

          status:
            "EM_ANDAMENTO",

          metas:
            metasStage,

          criteriosAvaliacao:
            criterios,

          criadoPor:
            req.user.id
        });
    } catch (stageError) {
      /*
        Se ocorrer erro ao criar o estágio,
        evitamos deixar um vínculo ROCAM ativo
        sem estágio correspondente.
      */

      profile.ativo =
        false;

      profile.situacaoRocam =
        "DESLIGADO";

      profile.dataSaidaRocam =
        new Date();

      profile.motivoSaida =
        "Cadastro de estágio não concluído";

      profile.atualizadoPor =
        req.user.id;

      await profile.save();

      throw stageError;
    }

    /* -----------------------------------------------------
       QUALIFICAÇÃO NA HIERARQUIA GERAL

       Não altera patente, função ou status geral.
       Apenas marca a qualificação ROCAM.
    ----------------------------------------------------- */

    hierarchy.qualificacaoRocam =
      "ESTAGIARIO_ROCAM";

    await hierarchy.save();

    /* -----------------------------------------------------
       HISTÓRICO ROCAM
    ----------------------------------------------------- */

    await RocamHistory.create({
      user:
        user._id,

      funcional:
        hierarchy.funcional,

      evento:
        "INGRESSO_ESTAGIO",

      titulo:
        "Ingresso no Estágio ROCAM",

      descricao:
        "Policial cadastrado como Estagiário ROCAM.",

      papelAnterior:
        "",

      papelNovo:
        "ESTAGIARIO_ROCAM",

      dataEvento:
        ingresso,

      responsavel:
        req.user.id,

      metadata: {
        stageId:
          stage._id,

        metas:
          stage.metas
      }
    });

    return res.status(201).json({
      message:
        "Estagiário ROCAM cadastrado com sucesso",

      profile,
      stage
    });
  } catch (err) {
    console.error(
      "Erro createTrainee ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao cadastrar Estagiário ROCAM"
    });
  }
};

/* =========================================================
   LISTAR ESTAGIÁRIOS ROCAM
========================================================= */

exports.listTrainees = async (req, res) => {
  try {
    const profiles =
      await RocamProfile.find({
        ativo: true,
        papelRocam:
          "ESTAGIARIO_ROCAM"
      })
        .sort({
          dataIngressoRocam: 1,
          nome: 1
        })
        .lean();

    if (!profiles.length) {
      return res.json([]);
    }

    const userIds =
      profiles.map(
        (profile) =>
          profile.user
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

        if (
          !stageMap.has(key)
        ) {
          stageMap.set(
            key,
            stage
          );
        }
      }
    );

    const resultado =
      profiles.map(
        (profile) => {
          const stage =
            stageMap.get(
              String(
                profile.user
              )
            ) || null;

          return {
            _id:
              profile._id,

            user:
              profile.user,

            funcional:
              profile.funcional,

            nome:
              profile.nome,

            patente:
              profile.patente,

            papelRocam:
              profile.papelRocam,

            situacaoRocam:
              profile.situacaoRocam,

            ativo:
              profile.ativo,

            dataIngressoRocam:
              profile.dataIngressoRocam,

            stage,

            progresso:
              stage?.progresso ||
              null,

            metas:
              stage?.metas ||
              null,

            criteriosAvaliacao:
              stage
                ?.criteriosAvaliacao ||
              [],

            statusEstagio:
              stage?.status ||
              null,

            dataInicioEstagio:
              stage?.dataInicio ||
              null
          };
        }
      );

    return res.json(
      resultado
    );
  } catch (err) {
    console.error(
      "Erro listTrainees ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar Estagiários ROCAM"
    });
  }
};

/* =========================================================
   LISTAR BRAÇAIS ROCAM
========================================================= */

exports.listBracais = async (req, res) => {
  try {
    const bracais =
      await RocamProfile.find({
        ativo: true,

        // Comando e Subcomando também possuem Braçal ROCAM.
        papelRocam: {
          $in: [
            "COMANDO_ROCAM",
            "SUBCOMANDO_ROCAM",
            "BRACAL_ROCAM"
          ]
        }
      })
        .sort({
          nome: 1
        })
        .lean();

    const resultado =
      bracais.map((profile) => ({
        ...profile,

        // Independentemente do cargo exercido dentro da ROCAM,
        // estes três papéis possuem a qualificação de Braçal.
        qualificacaoRocam:
          "BRACAL_ROCAM"
      }));

    return res.json(resultado);

  } catch (err) {
    console.error(
      "Erro listBracais:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar Braçais ROCAM"
    });
  }
};

/* =========================================================
   APROVAR ESTÁGIO ROCAM
========================================================= */

exports.approveStage = async (req, res) => {
  try {
    const {
      numeroBoletim,
      observacao
    } = req.body;

    if (
      !numeroBoletim ||
      !String(
        numeroBoletim
      ).trim()
    ) {
      return res.status(400).json({
        message:
          "Informe o número do boletim de aprovação"
      });
    }

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
          $in: [
            "EM_ANDAMENTO",
            "APTO_APROVACAO",
            "APROVACAO_SOLICITADA"
          ]
        }
      }).sort({
        createdAt: -1
      });

    if (!stage) {
      return res.status(404).json({
        message:
          "Estágio ativo não encontrado"
      });
    }

    const agora =
      new Date();

    stage.status =
      "APROVADO";

    stage.dataConclusao =
      agora;

    stage.aprovadoPor =
      req.user.id;

    stage.boletimAprovacao =
      String(
        numeroBoletim
      ).trim();

    stage.observacaoConclusao =
      String(
        observacao || ""
      ).trim();

    await stage.save();

    profile.papelRocam =
      "BRACAL_ROCAM";

    profile.situacaoRocam =
      "ATIVO";

    profile.atualizadoPor =
      req.user.id;

    await profile.save();

    const hierarchy =
      await Hierarchy.findOne({
        user:
          profile.user
      });

    if (hierarchy) {
      hierarchy.qualificacaoRocam =
        "BRACAL_ROCAM";

      await hierarchy.save();
    }

    await RocamHistory.create({
      user:
        profile.user,

      funcional:
        profile.funcional,

      evento:
        "APROVACAO_ESTAGIO",

      titulo:
        "Aprovação no Estágio ROCAM",

      descricao:
        String(
          observacao ||
          "Estágio ROCAM concluído com aprovação."
        ).trim(),

      papelAnterior:
        "ESTAGIARIO_ROCAM",

      papelNovo:
        "BRACAL_ROCAM",

      numeroBoletim:
        String(
          numeroBoletim
        ).trim(),

      dataEvento:
        agora,

      responsavel:
        req.user.id,

      metadata: {
        stageId:
          stage._id
      }
    });

    return res.json({
      message:
        "Estágio aprovado. Policial promovido a Braçal ROCAM.",

      profile,
      stage
    });
  } catch (err) {
    console.error(
      "Erro approveStage:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao aprovar estágio ROCAM"
    });
  }
};

/* =========================================================
   DESIGNAR FUNÇÃO ROCAM
========================================================= */

exports.assignRole = async (req, res) => {
  try {
    const {
      userId,
      papelRocam,
      dataIngresso
    } = req.body;

    /* =====================================================
       VALIDAÇÕES
    ===================================================== */

    if (!userId) {
      return res.status(400).json({
        message:
          "Selecione um policial"
      });
    }

    const papeisPermitidos = [
      "COMANDO_ROCAM",
      "SUBCOMANDO_ROCAM",
      "BRACAL_ROCAM"
    ];

    if (
      papelRocam ===
      "ESTAGIARIO_ROCAM"
    ) {
      return res.status(400).json({
        message:
          "Use o cadastro de Estagiário ROCAM para iniciar um estágio."
      });
    }

    if (
      !papeisPermitidos.includes(
        papelRocam
      )
    ) {
      return res.status(400).json({
        message:
          "Função ROCAM inválida"
      });
    }

    /* =====================================================
       LOCALIZAR NA HIERARQUIA GERAL
    ===================================================== */

    const hierarchy =
      await Hierarchy.findOne({
        user: userId,
        status: "Ativo"
      });

    if (!hierarchy) {
      return res.status(404).json({
        message:
          "Policial não encontrado na hierarquia ativa"
      });
    }

    /* =====================================================
       DATA DE INGRESSO
    ===================================================== */

    const ingresso =
      dataValidaOuAgora(
        dataIngresso
      );

    /* =====================================================
       LOCALIZAR PERFIL ROCAM
    ===================================================== */

    let profile =
      await RocamProfile.findOne({
        user:
          hierarchy.user
      });

    const papelAnterior =
      profile?.ativo
        ? profile.papelRocam
        : "";

    /* =====================================================
       CRIAR PERFIL CASO NÃO EXISTA
    ===================================================== */

    if (!profile) {
      profile =
        new RocamProfile({
          user:
            hierarchy.user,

          hierarchy:
            hierarchy._id,

          funcional:
            hierarchy.funcional,

          nome:
            hierarchy.nome,

          patente:
            hierarchy.patente,

          cadastradoPor:
            req.user.id
        });
    }

    /* =====================================================
       ATUALIZAR PERFIL ROCAM
    ===================================================== */

    profile.hierarchy =
      hierarchy._id;

    profile.funcional =
      hierarchy.funcional;

    profile.nome =
      hierarchy.nome;

    profile.patente =
      hierarchy.patente;

    profile.papelRocam =
      papelRocam;

    profile.situacaoRocam =
      "ATIVO";

    profile.ativo =
      true;

    /*
      Se já fazia parte da ROCAM e apenas mudou
      de função, preservamos a data original.

      Se estava desligado ou nunca teve ingresso,
      usamos a nova data.
    */

    if (
      !profile.dataIngressoRocam ||
      !papelAnterior
    ) {
      profile.dataIngressoRocam =
        ingresso;
    }

    profile.dataSaidaRocam =
      null;

    profile.motivoSaida =
      "";

    profile.boletimSaida =
      "";

    profile.atualizadoPor =
      req.user.id;

    await profile.save();

    /* =====================================================
       QUALIFICAÇÃO ROCAM NA HIERARQUIA GERAL

       REGRA:

       COMANDO_ROCAM
       = possui Braçal ROCAM

       SUBCOMANDO_ROCAM
       = possui Braçal ROCAM

       BRACAL_ROCAM
       = possui Braçal ROCAM

       O cargo exercido na ROCAM continua armazenado
       separadamente em profile.papelRocam.
    ===================================================== */

    if (
      [
        "COMANDO_ROCAM",
        "SUBCOMANDO_ROCAM",
        "BRACAL_ROCAM"
      ].includes(
        papelRocam
      )
    ) {
      hierarchy.qualificacaoRocam =
        "BRACAL_ROCAM";
    }

    await hierarchy.save();

    /* =====================================================
       HISTÓRICO

       Estou usando os eventos que JÁ EXISTEM no seu
       controller atual para evitar incompatibilidade
       com o enum do RocamHistory.
    ===================================================== */

    let evento =
      "ALTERACAO_FUNCAO";

    if (
      papelRocam ===
      "BRACAL_ROCAM"
    ) {
      evento =
        "CONCESSAO_BRACAL";
    }

    if (
      papelRocam ===
      "COMANDO_ROCAM"
    ) {
      evento =
        "INGRESSO_COMANDO";
    }

    if (
      papelRocam ===
      "SUBCOMANDO_ROCAM"
    ) {
      evento =
        "INGRESSO_SUBCOMANDO";
    }

    /* =====================================================
       TÍTULO DO HISTÓRICO
    ===================================================== */

    let titulo =
      "Alteração de função ROCAM";

    if (
      papelRocam ===
      "COMANDO_ROCAM"
    ) {
      titulo =
        "Designação para Comando ROCAM";
    }

    if (
      papelRocam ===
      "SUBCOMANDO_ROCAM"
    ) {
      titulo =
        "Designação para Subcomando ROCAM";
    }

    if (
      papelRocam ===
      "BRACAL_ROCAM"
    ) {
      titulo =
        "Designação para Braçal ROCAM";
    }

    /* =====================================================
       REGISTRAR HISTÓRICO
    ===================================================== */

    await RocamHistory.create({
      user:
        hierarchy.user,

      funcional:
        hierarchy.funcional,

      evento,

      titulo,

      descricao:
        papelAnterior
          ? `Função ROCAM alterada de ${papelAnterior} para ${papelRocam}.`
          : `Policial designado para ${papelRocam}.`,

      papelAnterior,

      papelNovo:
        papelRocam,

      dataEvento:
        new Date(),

      responsavel:
        req.user.id
    });

    /* =====================================================
       RETORNO
    ===================================================== */

    let mensagem =
      "Função ROCAM atualizada com sucesso";

    if (
      papelRocam ===
      "COMANDO_ROCAM"
    ) {
      mensagem =
        "Comandante ROCAM designado com sucesso";
    }

    if (
      papelRocam ===
      "SUBCOMANDO_ROCAM"
    ) {
      mensagem =
        "Subcomandante ROCAM designado com sucesso";
    }

    if (
      papelRocam ===
      "BRACAL_ROCAM"
    ) {
      mensagem =
        "Braçal ROCAM designado com sucesso";
    }

    return res.json({
      message:
        mensagem,

      profile,

      hierarchy: {
        _id:
          hierarchy._id,

        user:
          hierarchy.user,

        funcional:
          hierarchy.funcional,

        nome:
          hierarchy.nome,

        patente:
          hierarchy.patente,

        funcao:
          hierarchy.funcao,

        qualificacaoRocam:
          hierarchy.qualificacaoRocam
      }
    });

  } catch (err) {
    console.error(
      "Erro assignRole ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao designar função ROCAM"
    });
  }
};

/* =========================================================
   HIERARQUIA ROCAM
========================================================= */

exports.getHierarchy = async (req, res) => {
  try {
    const profiles =
      await RocamProfile.find({
        ativo: true
      })
        .sort({
          papelRocam: 1,
          patente: 1,
          nome: 1
        })
        .lean();

    const grupos = {
      comando: [],
      subcomando: [],
      bracais: [],
      estagiarios: []
    };

    profiles.forEach(
      (profile) => {
        if (
          profile.papelRocam ===
          "COMANDO_ROCAM"
        ) {
          grupos.comando.push(
            profile
          );
        }

        if (
          profile.papelRocam ===
          "SUBCOMANDO_ROCAM"
        ) {
          grupos.subcomando.push(
            profile
          );
        }

        if (
          profile.papelRocam ===
          "BRACAL_ROCAM"
        ) {
          grupos.bracais.push(
            profile
          );
        }

        if (
          profile.papelRocam ===
          "ESTAGIARIO_ROCAM"
        ) {
          grupos.estagiarios.push(
            profile
          );
        }
      }
    );

    /* -----------------------------------------------------
       ESTÁGIOS ATIVOS
    ----------------------------------------------------- */

    const stages =
      await RocamStage.find({
        status: {
          $in:
            STATUS_ESTAGIO_ABERTO
        }
      })
        .select(
          "user progresso status dataInicio metas"
        )
        .lean();

    const stageMap =
      new Map(
        stages.map(
          (stage) => [
            String(stage.user),
            stage
          ]
        )
      );

    grupos.estagiarios =
      grupos.estagiarios.map(
        (profile) => ({
          ...profile,

          stage:
            stageMap.get(
              String(
                profile.user
              )
            ) || null
        })
      );

    return res.json({
      total:
        profiles.length,

      ...grupos
    });
  } catch (err) {
    console.error(
      "Erro getHierarchy ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar Hierarquia ROCAM"
    });
  }
};

/* =========================================================
   MEU PERFIL ROCAM
========================================================= */

exports.getMyProfile = async (req, res) => {
  try {
    const profile =
      await RocamProfile.findOne({
        funcional:
          req.user.funcional,

        ativo: true
      }).lean();

    if (!profile) {
      return res.status(404).json({
        message:
          "Perfil ROCAM não encontrado"
      });
    }

    let stage =
      null;

    if (
      profile.papelRocam ===
      "ESTAGIARIO_ROCAM"
    ) {
      stage =
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
    }

    return res.json({
      profile,
      stage
    });
  } catch (err) {
    console.error(
      "Erro getMyProfile ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar perfil ROCAM"
    });
  }
};

/* =========================================================
   HISTÓRICO INDIVIDUAL
========================================================= */

exports.getHistory = async (req, res) => {
  try {
    const history =
      await RocamHistory.find({
        user:
          req.params.userId
      })
        .populate(
          "responsavel",
          "nome funcional"
        )
        .sort({
          dataEvento: -1
        });

    return res.json(
      history
    );
  } catch (err) {
    console.error(
      "Erro getHistory ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar histórico ROCAM"
    });
  }
};

/* =========================================================
   DESLIGAR DA ROCAM
========================================================= */

exports.removeFromRocam = async (req, res) => {
  try {
    const {
      motivo,
      numeroBoletim
    } = req.body;

    if (
      !motivo ||
      !String(motivo).trim()
    ) {
      return res.status(400).json({
        message:
          "Informe o motivo do desligamento"
      });
    }

    const profile =
      await RocamProfile.findOne({
        user:
          req.params.userId,

        ativo: true
      });

    if (!profile) {
      return res.status(404).json({
        message:
          "Vínculo ROCAM ativo não encontrado"
      });
    }

    const papelAnterior =
      profile.papelRocam;

    const agora =
      new Date();

    /* -----------------------------------------------------
       DESATIVA PERFIL ROCAM
    ----------------------------------------------------- */

    profile.ativo =
      false;

    profile.situacaoRocam =
      "DESLIGADO";

    profile.dataSaidaRocam =
      agora;

    profile.motivoSaida =
      String(motivo).trim();

    profile.boletimSaida =
      String(
        numeroBoletim || ""
      ).trim();

    profile.atualizadoPor =
      req.user.id;

    await profile.save();

    /* -----------------------------------------------------
       REMOVE QUALIFICAÇÃO ROCAM DA HIERARQUIA

       NÃO exclui o policial da hierarquia geral.
    ----------------------------------------------------- */

    const hierarchy =
      await Hierarchy.findOne({
        user:
          profile.user
      });

    if (hierarchy) {
      hierarchy.qualificacaoRocam =
        "NENHUM";

      await hierarchy.save();
    }

    /* -----------------------------------------------------
       ENCERRA ESTÁGIO ABERTO
    ----------------------------------------------------- */

    await RocamStage.updateMany(
      {
        user:
          profile.user,

        status: {
          $in:
            STATUS_ESTAGIO_ABERTO
        }
      },
      {
        status:
          "DESLIGADO",

        dataConclusao:
          agora,

        observacaoConclusao:
          String(motivo).trim()
      }
    );

    /* -----------------------------------------------------
       HISTÓRICO
    ----------------------------------------------------- */

    await RocamHistory.create({
      user:
        profile.user,

      funcional:
        profile.funcional,

      evento:
        papelAnterior ===
        "BRACAL_ROCAM"
          ? "RETIRADA_BRACAL"
          : "DESLIGAMENTO_ROCAM",

      titulo:
        papelAnterior ===
        "BRACAL_ROCAM"
          ? "Retirada do Braçal ROCAM"
          : "Desligamento da ROCAM",

      descricao:
        String(motivo).trim(),

      papelAnterior,

      papelNovo:
        "",

      numeroBoletim:
        String(
          numeroBoletim || ""
        ).trim(),

      dataEvento:
        agora,

      responsavel:
        req.user.id
    });

    return res.json({
      message:
        "Policial desligado da ROCAM com sucesso"
    });
  } catch (err) {
    console.error(
      "Erro removeFromRocam:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao desligar policial da ROCAM"
    });
  }
};


/* =========================================================
   ATUALIZAR METAS DO ESTÁGIO ROCAM
========================================================= */

exports.updateStageGoals = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      metas,
      observacoes
    } = req.body;

    /* =====================================================
       LOCALIZAR PERFIL DO ESTAGIÁRIO
    ===================================================== */

    const profile =
      await RocamProfile.findOne({
        user: userId,
        ativo: true,
        papelRocam: "ESTAGIARIO_ROCAM"
      });

    if (!profile) {
      return res.status(404).json({
        message:
          "Estagiário ROCAM não encontrado"
      });
    }

    /* =====================================================
       LOCALIZAR ESTÁGIO ATIVO
    ===================================================== */

    const stage =
      await RocamStage.findOne({
        user: userId,

        status: {
          $in: [
            "EM_ANDAMENTO",
            "APTO_APROVACAO",
            "APROVACAO_SOLICITADA"
          ]
        }
      }).sort({
        createdAt: -1
      });

    if (!stage) {
      return res.status(404).json({
        message:
          "Estágio ROCAM ativo não encontrado"
      });
    }

    /* =====================================================
       GARANTIR OBJETO DE METAS
    ===================================================== */

    if (!stage.metas) {
      stage.metas = {};
    }

    /* =====================================================
       SALVAR METAS ANTERIORES PARA HISTÓRICO
    ===================================================== */

    const metasAnteriores =
      JSON.parse(
        JSON.stringify(
          stage.metas || {}
        )
      );

    /* =====================================================
       HORAS DE PATRULHAMENTO
    ===================================================== */

    if (
      metas?.horasPatrulhamento
    ) {
      stage.metas.horasPatrulhamento = {
        habilitada:
          metas.horasPatrulhamento
            .habilitada !== false,

        valor:
          Math.max(
            0,
            Number(
              metas.horasPatrulhamento
                .valor || 0
            )
          )
      };
    }

    /* =====================================================
       QUANTIDADE DE PATRULHAS
    ===================================================== */

    if (
      metas?.quantidadePatrulhas
    ) {
      stage.metas.quantidadePatrulhas = {
        habilitada:
          metas.quantidadePatrulhas
            .habilitada !== false,

        valor:
          Math.max(
            0,
            Number(
              metas.quantidadePatrulhas
                .valor || 0
            )
          )
      };
    }

    /* =====================================================
       QUANTIDADE DE AVALIAÇÕES
    ===================================================== */

    if (
      metas?.quantidadeAvaliacoes
    ) {
      stage.metas.quantidadeAvaliacoes = {
        habilitada:
          metas.quantidadeAvaliacoes
            .habilitada !== false,

        valor:
          Math.max(
            0,
            Number(
              metas.quantidadeAvaliacoes
                .valor || 0
            )
          )
      };
    }

    /* =====================================================
       MÉDIA MÍNIMA DAS AVALIAÇÕES
    ===================================================== */

    if (
      metas?.mediaMinimaAvaliacoes
    ) {
      stage.metas.mediaMinimaAvaliacoes = {
        habilitada:
          metas.mediaMinimaAvaliacoes
            .habilitada !== false,

        valor:
          Math.max(
            0,
            Math.min(
              100,
              Number(
                metas.mediaMinimaAvaliacoes
                  .valor || 0
              )
            )
          )
      };
    }

    /* =====================================================
       QUANTIDADE DE QUESTIONÁRIOS
    ===================================================== */

    if (
      metas?.quantidadeQuestionarios
    ) {
      stage.metas.quantidadeQuestionarios = {
        habilitada:
          metas.quantidadeQuestionarios
            .habilitada !== false,

        valor:
          Math.max(
            0,
            Number(
              metas.quantidadeQuestionarios
                .valor || 0
            )
          )
      };
    }

    /* =====================================================
       APROVEITAMENTO DOS QUESTIONÁRIOS
    ===================================================== */

    if (
      metas?.aproveitamentoQuestionarios
    ) {
      stage.metas.aproveitamentoQuestionarios = {
        habilitada:
          metas.aproveitamentoQuestionarios
            .habilitada !== false,

        valor:
          Math.max(
            0,
            Math.min(
              100,
              Number(
                metas.aproveitamentoQuestionarios
                  .valor || 0
              )
            )
          )
      };
    }

    /* =====================================================
       AUSÊNCIAS INJUSTIFICADAS
    ===================================================== */

    if (
      metas?.ausenciasInjustificadas
    ) {
      stage.metas.ausenciasInjustificadas = {
        habilitada:
          metas.ausenciasInjustificadas
            .habilitada !== false,

        maximo:
          Math.max(
            0,
            Number(
              metas.ausenciasInjustificadas
                .maximo || 0
            )
          )
      };
    }

    /* =====================================================
       OBSERVAÇÕES
    ===================================================== */

    if (
      observacoes !== undefined
    ) {
      stage.observacoes =
        String(
          observacoes || ""
        ).trim();
    }

    /* =====================================================
       MARCAR ALTERAÇÃO NO MONGOOSE
    ===================================================== */

    stage.markModified("metas");

    /* =====================================================
       SALVAR
    ===================================================== */

    await stage.save();

    /* =====================================================
       REGISTRAR HISTÓRICO
    ===================================================== */

    await RocamHistory.create({
      user:
        profile.user,

      funcional:
        profile.funcional,

      evento:
        "ALTERACAO_METAS",

      titulo:
        "Alteração de metas do Estágio ROCAM",

      descricao:
        String(
          observacoes ||
            "Metas do estágio alteradas pelo Comando ROCAM."
        ).trim(),

      papelAnterior:
        profile.papelRocam,

      papelNovo:
        profile.papelRocam,

      dataEvento:
        new Date(),

      responsavel:
        req.user.id,

      metadata: {
        stageId:
          stage._id,

        metasAnteriores,

        metasNovas:
          stage.metas
      }
    });

    /* =====================================================
       RETORNO
    ===================================================== */

    return res.json({
      message:
        "Metas atualizadas com sucesso",

      stage
    });

  } catch (err) {
    console.error(
      "Erro updateStageGoals ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao atualizar metas ROCAM"
    });
  }
};


/* =========================================================
   FICHA COMPLETA DO ESTAGIÁRIO ROCAM
========================================================= */

exports.getTraineeDetails = async (req, res) => {
  try {
    const { userId } =
      req.params;

    /* =====================================================
       PERFIL ROCAM
    ===================================================== */

    const profile =
      await RocamProfile.findOne({
        user: userId,
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

    /* =====================================================
       ESTÁGIO ATIVO
    ===================================================== */

    const stage =
      await RocamStage.findOne({
        user: userId,

        status: {
          $in: [
            "EM_ANDAMENTO",
            "APTO_APROVACAO",
            "APROVACAO_SOLICITADA"
          ]
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

    /* =====================================================
       CALCULAR SITUAÇÃO ATUAL
    ===================================================== */

    const situacao =
      calcularSituacaoEstagio(
        stage
      );

    /* =====================================================
       HISTÓRICO
    ===================================================== */

    const historico =
      await RocamHistory.find({
        user: userId
      })
        .populate(
          "responsavel",
          "nome funcional"
        )
        .sort({
          dataEvento: -1
        })
        .lean();

    /* =====================================================
       RETORNO
    ===================================================== */

    return res.json({
      profile,

      stage,

      situacao,

      historico
    });

  } catch (err) {
    console.error(
      "Erro getTraineeDetails ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar ficha do Estagiário ROCAM"
    });
  }
};


/* =========================================================
   RECALCULAR PROGRESSO DO ESTÁGIO ROCAM
========================================================= */

exports.recalculateStage = async (req, res) => {
  try {
    const { userId } =
      req.params;

    /* =====================================================
       PERFIL
    ===================================================== */

    const profile =
      await RocamProfile.findOne({
        user: userId,
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

    /* =====================================================
       ESTÁGIO
    ===================================================== */

    const stage =
      await RocamStage.findOne({
        user: userId,

        status: {
          $in: [
            "EM_ANDAMENTO",
            "APTO_APROVACAO",
            "APROVACAO_SOLICITADA"
          ]
        }
      }).sort({
        createdAt: -1
      });

    if (!stage) {
      return res.status(404).json({
        message:
          "Estágio ROCAM ativo não encontrado"
      });
    }

    /* =====================================================
       CALCULAR
    ===================================================== */

    const situacao =
      calcularSituacaoEstagio(
        stage
      );

    /* =====================================================
       GARANTIR PROGRESSO
    ===================================================== */

    if (!stage.progresso) {
      stage.progresso = {};
    }

    stage.progresso.percentualGeral =
      situacao.percentualGeral;

    /* =====================================================
       STATUS AUTOMÁTICO
    ===================================================== */

    if (
      situacao.apto === true
    ) {
      stage.status =
        "APTO_APROVACAO";
    } else if (
      stage.status ===
      "APTO_APROVACAO"
    ) {
      /*
        Se alguma meta foi alterada e
        deixou de ser cumprida, volta
        para EM_ANDAMENTO.
      */
      stage.status =
        "EM_ANDAMENTO";
    }

    /* =====================================================
       SALVAR
    ===================================================== */

    stage.markModified(
      "progresso"
    );

    await stage.save();

    /* =====================================================
       RETORNO
    ===================================================== */

    return res.json({
      message:
        "Progresso ROCAM recalculado com sucesso",

      stage,

      situacao: {
        ...situacao,

        status:
          stage.status
      }
    });

  } catch (err) {
    console.error(
      "Erro recalculateStage ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao recalcular progresso do Estágio ROCAM"
    });
  }
};

/* =========================================================
   CONTEXTO / PERMISSÕES ROCAM
========================================================= */

exports.getAccessContext = async (req, res) => {
  try {

    /* =====================================================
       HIERARQUIA GERAL
    ===================================================== */

    const hierarchy =
      await Hierarchy.findOne({
        funcional:
          req.user.funcional
      }).lean();

    /* =====================================================
       PERFIL ROCAM
    ===================================================== */

    const profile =
      await RocamProfile.findOne({
        funcional:
          req.user.funcional,

        ativo: true
      }).lean();

    /* =====================================================
       SUPERADMIN
    ===================================================== */

    const superadmin =
      req.user.role ===
      "superadmin";

    /* =====================================================
       COMANDO DO BATALHÃO

       Não depende de RocamProfile.
    ===================================================== */

    const comandoBatalhao =
      [
        "Comando do Batalhão",
        "Subcomando do Batalhão"
      ].includes(
        hierarchy?.funcao
      );

    /* =====================================================
       COMANDO ROCAM
    ===================================================== */

    const comandoRocam =
      profile?.ativo === true &&
      [
        "COMANDO_ROCAM",
        "SUBCOMANDO_ROCAM"
      ].includes(
        profile?.papelRocam
      );

    /* =====================================================
       BRAÇAL ROCAM
    ===================================================== */

    const bracal =
  profile?.ativo === true &&
  [
    "COMANDO_ROCAM",
    "SUBCOMANDO_ROCAM",
    "BRACAL_ROCAM"
  ].includes(
    profile?.papelRocam
  );

    /* =====================================================
       ESTAGIÁRIO ROCAM
    ===================================================== */

    const estagiario =
      profile?.ativo === true &&
      profile?.papelRocam ===
        "ESTAGIARIO_ROCAM";

    /* =====================================================
       PODE ACESSAR PAINEL ROCAM
    ===================================================== */

    const podeAcessar =
      superadmin ||
      comandoBatalhao ||
      comandoRocam ||
      bracal ||
      estagiario;

    /* =====================================================
       PODE GERENCIAR ROCAM
    ===================================================== */

    const podeGerenciar =
      superadmin ||
      comandoBatalhao ||
      comandoRocam;

    /* =====================================================
       RETORNO
    ===================================================== */

    return res.json({
      podeAcessar,
      podeGerenciar,

      superadmin,
      comandoBatalhao,
      comandoRocam,
      bracal,
      estagiario,

      papelRocam:
        profile?.papelRocam ||
        null,

      situacaoRocam:
        profile?.situacaoRocam ||
        null,

      profile:
        profile || null,

      hierarchy:
        hierarchy
          ? {
              _id:
                hierarchy._id,

              user:
                hierarchy.user,

              funcional:
                hierarchy.funcional,

              nome:
                hierarchy.nome,

              patente:
                hierarchy.patente,

              categoria:
                hierarchy.categoria,

              funcao:
                hierarchy.funcao,

              status:
                hierarchy.status,

              qualificacaoRocam:
                hierarchy.qualificacaoRocam ||
                "NENHUM"
            }
          : null
    });

  } catch (err) {
    console.error(
      "Erro getAccessContext ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao consultar acesso ROCAM"
    });
  }
};