const RocamStage = require(
  "../models/RocamStage"
);

const RocamProfile = require(
  "../models/RocamProfile"
);

const RocamHistory = require(
  "../models/RocamHistory"
);

/* =========================================================
   STATUS DE ESTÁGIO ABERTO
========================================================= */

const STATUS_ESTAGIO_ABERTO = [
  "EM_ANDAMENTO",
  "APTO_APROVACAO",
  "APROVACAO_SOLICITADA"
];

/* =========================================================
   NORMALIZAR MINUTOS
========================================================= */

function normalizarMinutos(valor) {
  const numero =
    Number(valor || 0);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    return 0;
  }

  return Math.floor(numero);
}

/* =========================================================
   VERIFICAR RSO ROCAM
========================================================= */

function ehRocam(rso) {
  return (
    String(
      rso?.tipoPatrulhamento ||
        ""
    )
      .trim()
      .toUpperCase() ===
    "ROCAM"
  );
}

/* =========================================================
   INTEGRANTES ROCAM
========================================================= */

function obterIntegrantesRocam(
  rso
) {
  if (
    !Array.isArray(
      rso?.equipe
    )
  ) {
    return [];
  }

  return rso.equipe.filter(
    Boolean
  );
}

/* =========================================================
   PERCENTUAL DAS HORAS
========================================================= */

function calcularPercentualHoras(
  minutos,
  metaHoras
) {
  const horas =
    Number(
      minutos || 0
    ) / 60;

  const meta =
    Number(
      metaHoras || 0
    );

  if (meta <= 0) {
    return 100;
  }

  return Math.max(
    0,

    Math.min(
      100,

      Number(
        (
          (
            horas /
            meta
          ) *
          100
        ).toFixed(2)
      )
    )
  );
}

/* =========================================================
   CONTABILIZAR UM ESTAGIÁRIO
========================================================= */

async function contabilizarIntegrante({
  integrante,
  rso,
  aprovadoPor
}) {
  const funcional =
    Number(
      integrante?.funcional
    );

  const minutos =
    normalizarMinutos(
      integrante?.tempoMinutos
    );

  /* =====================================================
     TEMPO VÁLIDO
  ===================================================== */

  if (
    !funcional ||
    minutos <= 0
  ) {
    return {
      contabilizado: false,

      motivo:
        "SEM_TEMPO_VALIDO"
    };
  }

  /* =====================================================
     SOMENTE ESTAGIÁRIO
  ===================================================== */

  if (
    integrante
      ?.qualificacaoRocam !==
    "ESTAGIARIO_ROCAM"
  ) {
    return {
      contabilizado: false,

      motivo:
        "NAO_ESTAGIARIO"
    };
  }

  /* =====================================================
     PERFIL ROCAM
  ===================================================== */

  const profile =
    await RocamProfile.findOne({
      funcional,

      ativo: true,

      papelRocam:
        "ESTAGIARIO_ROCAM"
    });

  if (!profile) {
    return {
      contabilizado: false,

      motivo:
        "SEM_PERFIL_ATIVO"
    };
  }

  /* =====================================================
     ESTÁGIO ATIVO
  ===================================================== */

  const stage =
    await RocamStage.findOne({
      user:
        profile.user,

      status: {
        $in:
          STATUS_ESTAGIO_ABERTO
      }
    }).sort({
      createdAt: -1
    });

  if (!stage) {
    return {
      contabilizado: false,

      motivo:
        "SEM_ESTAGIO_ATIVO"
    };
  }

  /* =====================================================
     PROGRESSO
  ===================================================== */

  if (!stage.progresso) {
    stage.progresso = {};
  }

  /* =====================================================
     RSOs JÁ CONTABILIZADOS
  ===================================================== */

  const registrosAtuais =
    Array.isArray(
      stage.progresso
        .rsosRocamContabilizados
    )
      ? stage.progresso
          .rsosRocamContabilizados
      : [];

  const rsoId =
    String(rso._id);

  const jaContabilizado =
    registrosAtuais.some(
      (item) => {
        return (
          String(
            item?.rsoId ||
              item
          ) === rsoId
        );
      }
    );

  if (jaContabilizado) {
    return {
      contabilizado: false,

      motivo:
        "RSO_JA_CONTABILIZADO"
    };
  }

  /* =====================================================
     MINUTOS
  ===================================================== */

  const minutosAnteriores =
    Number(
      stage.progresso
        .horasPatrulhamentoMin ||
        0
    );

  const minutosNovos =
    minutosAnteriores +
    minutos;

  /* =====================================================
     HORAS
  ===================================================== */

  const horasCumpridas =
    Number(
      (
        minutosNovos /
        60
      ).toFixed(2)
    );

  /* =====================================================
     PATRULHAS
  ===================================================== */

  const patrulhasAnteriores =
    Number(
      stage.progresso
        .patrulhasRealizadas ||

      stage.progresso
        .quantidadePatrulhas ||

      0
    );

  const patrulhasNovas =
    patrulhasAnteriores +
    1;

  /* =====================================================
     META DE HORAS

     Aceita formato novo e antigo.
  ===================================================== */

  let metaHoras = 0;

  const metaHorasRaw =
    stage.metas
      ?.horasPatrulhamento;

  if (
    typeof metaHorasRaw ===
    "number"
  ) {
    metaHoras =
      Number(
        metaHorasRaw || 0
      );
  } else if (
    metaHorasRaw &&
    metaHorasRaw
      .habilitada !== false
  ) {
    metaHoras =
      Number(
        metaHorasRaw.valor ||
          0
      );
  }

  const percentualHoras =
    calcularPercentualHoras(
      minutosNovos,
      metaHoras
    );

  /* =====================================================
     GRAVAR PROGRESSO
  ===================================================== */

  stage.progresso
    .horasPatrulhamentoMin =
    minutosNovos;

  stage.progresso
    .horasCumpridas =
    horasCumpridas;

  stage.progresso
    .horasPatrulhamento =
    horasCumpridas;

  stage.progresso
    .patrulhasRealizadas =
    patrulhasNovas;

  stage.progresso
    .quantidadePatrulhas =
    patrulhasNovas;

  stage.progresso
    .percentualHoras =
    percentualHoras;

  /* =====================================================
     ANTI-DUPLICIDADE
  ===================================================== */

  registrosAtuais.push({
    rsoId:
      rso._id,

    viatura:
      rso.viatura || "",

    minutos,

    horas:
      Number(
        (
          minutos /
          60
        ).toFixed(2)
      ),

    dataAprovacao:
      new Date()
  });

  stage.progresso
    .rsosRocamContabilizados =
    registrosAtuais;

  /*
    progresso é Mixed.
  */
  stage.markModified(
    "progresso"
  );

  await stage.save();

  /* =====================================================
     HISTÓRICO ROCAM

     Se seu RocamHistory ainda não aceitar
     PATRULHA_ROCAM no enum, as horas continuam sendo
     contabilizadas; somente esse histórico dará erro
     no console.
  ===================================================== */

  try {
    await RocamHistory.create({
      user:
        profile.user,

      funcional:
        profile.funcional,

      evento:
        "PATRULHA_ROCAM",

      titulo:
        "Patrulhamento ROCAM contabilizado",

      descricao:
        `${minutos} minutos de patrulhamento ROCAM contabilizados através do RSO ${rso._id}.`,

      papelAnterior:
        profile.papelRocam,

      papelNovo:
        profile.papelRocam,

      dataEvento:
        new Date(),

      responsavel:
        aprovadoPor ||
        undefined,

      metadata: {
        rsoId:
          rso._id,

        viatura:
          rso.viatura ||
          "",

        minutos,

        horas:
          Number(
            (
              minutos /
              60
            ).toFixed(2)
          ),

        horasAcumuladas:
          horasCumpridas,

        patrulhasAcumuladas:
          patrulhasNovas
      }
    });
  } catch (historyError) {
    console.error(
      "Erro ao registrar histórico de horas ROCAM:",
      historyError
    );
  }

  return {
    contabilizado: true,

    funcional,

    minutos,

    horas:
      Number(
        (
          minutos /
          60
        ).toFixed(2)
      ),

    horasAcumuladas:
      horasCumpridas,

    patrulhasAcumuladas:
      patrulhasNovas
  };
}

/* =========================================================
   CONTABILIZAR RSO ROCAM
========================================================= */

exports.contabilizarHorasEstagioRocam =
  async (
    rso,
    aprovadoPor = null
  ) => {
    /* =====================================================
       RSO EXISTE
    ===================================================== */

    if (!rso) {
      return {
        processado: false,

        motivo:
          "RSO_INVALIDO",

        resultados: []
      };
    }

    /* =====================================================
       SOMENTE ROCAM
    ===================================================== */

    if (!ehRocam(rso)) {
      return {
        processado: false,

        motivo:
          "NAO_ROCAM",

        resultados: []
      };
    }

    /* =====================================================
       STATUS PERMITIDO
    ===================================================== */

    if (
      ![
        "Pendente",
        "Aprovado"
      ].includes(
        rso.status
      )
    ) {
      return {
        processado: false,

        motivo:
          "STATUS_INVALIDO",

        resultados: []
      };
    }

    /* =====================================================
       INTEGRANTES
    ===================================================== */

    const integrantes =
      obterIntegrantesRocam(
        rso
      );

    const resultados =
      [];

    /* =====================================================
       PROCESSAR UM POR UM
    ===================================================== */

    for (
      const integrante of
      integrantes
    ) {
      try {
        const resultado =
          await contabilizarIntegrante({
            integrante,

            rso,

            aprovadoPor
          });

        resultados.push({
          funcional:
            integrante
              ?.funcional ||
            null,

          nome:
            integrante
              ?.nome ||
            "",

          ...resultado
        });
      } catch (error) {
        console.error(
          `Erro horas ROCAM funcional ${integrante?.funcional}:`,
          error
        );

        resultados.push({
          funcional:
            integrante
              ?.funcional ||
            null,

          nome:
            integrante
              ?.nome ||
            "",

          contabilizado:
            false,

          motivo:
            "ERRO",

          erro:
            error.message
        });
      }
    }

    /* =====================================================
       RETORNO
    ===================================================== */

    return {
      processado: true,

      totalIntegrantes:
        integrantes.length,

      totalContabilizados:
        resultados.filter(
          (item) =>
            item.contabilizado
        ).length,

      resultados
    };
  };