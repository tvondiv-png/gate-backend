const RSO = require("../models/RSO");
const RSOHistory = require("../models/RSOHistory");

const {
  registrarHoras
} = require("../services/patrolHoursService");

const {
  contabilizarHorasEstagioRocam
} = require(
  "../services/rocamStageHoursService"
);

const logAction = require("../utils/logAction");

const {
  somarApreensoes
} = require("./seizureController");

/* =========================================================
   CALCULAR MINUTOS ENTRE DUAS DATAS
========================================================= */

const calcularMinutos = (inicio, fim) => {
  if (!inicio || !fim) {
    return 0;
  }

  const diff =
    new Date(fim).getTime() -
    new Date(inicio).getTime();

  const min =
    Math.floor(
      diff / 60000
    );

  return min > 0
    ? min
    : 0;
};

/* =========================================================
   RETORNAR TODOS OS INTEGRANTES DO RSO

   Compatível com:

   NOVO:
   equipe[]

   ANTIGO:
   equipeFixa
   equipeRotativa
========================================================= */

const getTodosIntegrantes = (rso) => {
  const integrantes = [];

  /* =========================
     NOVA EQUIPE
  ========================= */

  if (
    Array.isArray(
      rso?.equipe
    )
  ) {
    rso.equipe.forEach(
      (p) => {
        if (p) {
          integrantes.push(p);
        }
      }
    );
  }

  /* =========================
     EQUIPE FIXA ANTIGA
  ========================= */

  if (
    rso?.equipeFixa?.chefe
  ) {
    integrantes.push(
      rso.equipeFixa.chefe
    );
  }

  if (
    rso?.equipeFixa?.auxiliar
  ) {
    integrantes.push(
      rso.equipeFixa.auxiliar
    );
  }

  /* =========================
     EQUIPE ROTATIVA ANTIGA
  ========================= */

  Object.values(
    rso?.equipeRotativa || {}
  ).forEach((lista) => {
    if (
      Array.isArray(lista)
    ) {
      lista.forEach(
        (p) => {
          if (p) {
            integrantes.push(p);
          }
        }
      );
    }
  });

  return integrantes;
};

/* =========================================================
   CALCULAR TEMPO REAL DO RSO

   Menor entrada → maior saída
========================================================= */

const calcularTempoRealRSO = (rso) => {
  const datas = [];

  const integrantes =
    getTodosIntegrantes(rso);

  integrantes.forEach((p) => {
    if (
      p?.horaEntrada
    ) {
      datas.push(
        new Date(
          p.horaEntrada
        )
      );
    }

    if (
      p?.horaSaida
    ) {
      datas.push(
        new Date(
          p.horaSaida
        )
      );
    }
  });

  if (!datas.length) {
    return 0;
  }

  const menor =
    new Date(
      Math.min(
        ...datas.map(
          (d) =>
            d.getTime()
        )
      )
    );

  const maior =
    new Date(
      Math.max(
        ...datas.map(
          (d) =>
            d.getTime()
        )
      )
    );

  return calcularMinutos(
    menor,
    maior
  );
};

/* =========================================================
   CONTABILIZAR HORAS INDIVIDUAIS UMA ÚNICA VEZ
========================================================= */

const contabilizarHorasSeNecessario =
  async (rso) => {
    if (
      rso.horasJaContabilizadas
    ) {
      return;
    }

    const integrantes =
      getTodosIntegrantes(rso);

    for (
      const p of integrantes
    ) {
      if (
        p?.funcional &&
        Number(
          p.tempoMinutos
        ) > 0
      ) {
        await registrarHoras(
          p.funcional,
          Number(
            p.tempoMinutos
          )
        );
      }
    }

    rso.horasJaContabilizadas =
      true;

    rso.dataContabilizacaoHoras =
      new Date();
  };

/* =========================================================
   ENCERRAR UM INTEGRANTE
========================================================= */

const encerrarIntegrante = (
  integrante,
  momento
) => {
  if (!integrante) {
    return;
  }

  if (
    integrante.status !==
    "Ativo"
  ) {
    return;
  }

  integrante.horaSaida =
    momento;

  integrante.tempoMinutos =
    calcularMinutos(
      integrante.horaEntrada,
      momento
    );

  integrante.status =
    "Encerrado";
};

/* =========================================================
   ENCERRAR TODOS OS INTEGRANTES
========================================================= */

const encerrarTodosIntegrantes = (
  rso,
  momento
) => {
  /* =========================
     NOVA EQUIPE
  ========================= */

  if (
    Array.isArray(
      rso?.equipe
    )
  ) {
    rso.equipe.forEach(
      (p) =>
        encerrarIntegrante(
          p,
          momento
        )
    );
  }

  /* =========================
     EQUIPE FIXA ANTIGA
  ========================= */

  encerrarIntegrante(
    rso?.equipeFixa?.chefe,
    momento
  );

  encerrarIntegrante(
    rso?.equipeFixa?.auxiliar,
    momento
  );

  /* =========================
     EQUIPE ROTATIVA ANTIGA
  ========================= */

  Object.values(
    rso?.equipeRotativa || {}
  )
    .flat()
    .forEach((p) =>
      encerrarIntegrante(
        p,
        momento
      )
    );
};

/* =========================================================
   BUSCAR MEMBRO DO RSO

   NOVO:
   tipoEquipe = "equipe"
   index = posição no array

   ANTIGO:
   fixa / rotativa
========================================================= */

const buscarMembroRSO = (
  rso,
  tipoEquipe,
  cargo,
  index
) => {
  /* =========================
     NOVA EQUIPE
  ========================= */

  if (
    tipoEquipe ===
    "equipe"
  ) {
    if (
      !Array.isArray(
        rso?.equipe
      )
    ) {
      return null;
    }

    return (
      rso.equipe[
        Number(index)
      ] || null
    );
  }

  /* =========================
     EQUIPE FIXA ANTIGA
  ========================= */

  if (
    tipoEquipe ===
    "fixa"
  ) {
    if (
      cargo ===
      "chefe"
    ) {
      return (
        rso.equipeFixa
          ?.chefe ||
        null
      );
    }

    if (
      cargo ===
      "auxiliar"
    ) {
      return (
        rso.equipeFixa
          ?.auxiliar ||
        null
      );
    }

    return null;
  }

  /* =========================
     EQUIPE ROTATIVA ANTIGA
  ========================= */

  if (
    tipoEquipe ===
    "rotativa"
  ) {
    if (
      !Array.isArray(
        rso.equipeRotativa
          ?.[cargo]
      )
    ) {
      return null;
    }

    return (
      rso.equipeRotativa[
        cargo
      ][Number(index)] ||
      null
    );
  }

  return null;
};

/* =========================================================
   LISTAR RSOs PENDENTES / ATIVOS
========================================================= */

exports.listPendentes =
  async (req, res) => {
    try {
      const rsos =
        await RSO.find({
          status: {
            $in: [
              "Pendente",
              "Ativo"
            ]
          }
        }).sort({
          createdAt: -1
        });

      return res.json(
        rsos
      );
    } catch (error) {
      console.error(
        "Erro ao listar RSOs:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Erro ao listar RSOs"
        });
    }
  };

/* =========================================================
   APROVAR RSO
========================================================= */

exports.aprovarRSO =
  async (req, res) => {
    try {
      const rso =
        await RSO.findById(
          req.params.id
        );

      if (
        !rso ||
        rso.status !==
          "Pendente"
      ) {
        return res
          .status(400)
          .json({
            message:
              "RSO inválido"
          });
      }

      /* =====================================================
         APREENSÕES
      ===================================================== */

      if (
        Array.isArray(
          rso.apreensoes
        ) &&
        rso.apreensoes
          .length > 0
      ) {
        await somarApreensoes(
          rso.apreensoes
        );
      }

      /* =====================================================
         HORAS GERAIS

         Mantém exatamente a contabilização que
         já existia no sistema.
      ===================================================== */

      await contabilizarHorasSeNecessario(
        rso
      );

      /* =====================================================
         HORAS DO ESTÁGIO ROCAM

         SOMENTE quando:
         - tipoPatrulhamento === ROCAM
         - RSO está sendo aprovado
         - integrante era ESTAGIARIO_ROCAM
      ===================================================== */

      let resultadoRocam = {
        processado: false,

        motivo:
          "NAO_ROCAM",

        resultados: []
      };

      if (
        String(
          rso.tipoPatrulhamento ||
            ""
        )
          .trim()
          .toUpperCase() ===
        "ROCAM"
      ) {
        resultadoRocam =
          await contabilizarHorasEstagioRocam(
            rso,
            req.user.id
          );
      }

      /* =====================================================
         TEMPO TOTAL DO RSO
      ===================================================== */

      const totalMinutos =
        calcularTempoRealRSO(
          rso
        );

      /* =====================================================
         HISTÓRICO
      ===================================================== */

      await RSOHistory.create({
        rsoId:
          rso._id,

        tipoPatrulhamento:
          rso.tipoPatrulhamento ||
          "VIATURA",

        viatura:
          rso.viatura,

        equipe:
          rso.equipe || [],

        equipeFixa:
          rso.equipeFixa,

        equipeRotativa:
          rso.equipeRotativa,

        apreensoes:
          rso.apreensoes,

        totalMinutos,

        aprovadoPor:
          req.user.id
      });

      /* =====================================================
         APROVAR
      ===================================================== */

      rso.status =
        "Aprovado";

      await rso.save();

      /* =====================================================
         LOG
      ===================================================== */

      await logAction({
        action:
          "RSO APROVADO",

        performedBy:
          req.user.id,

        details:
          `RSO ${rso._id} aprovado | Tipo: ${
            rso.tipoPatrulhamento ||
            "VIATURA"
          } | Viatura: ${
            rso.viatura
          } | ROCAM estágio contabilizados: ${
            resultadoRocam
              ?.totalContabilizados ||
            0
          }`
      });

      /* =====================================================
         RETORNO
      ===================================================== */

      return res.json({
        message:
          "RSO aprovado com sucesso",

        horasContabilizadas:
          true,

        dataContabilizacaoHoras:
          rso
            .dataContabilizacaoHoras,

        rocam:
          resultadoRocam
      });

    } catch (error) {
      console.error(
        "Erro ao aprovar RSO:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            error.message ||
            "Erro ao aprovar RSO"
        });
    }
  };

/* =========================================================
   REJEITAR RSO
========================================================= */

exports.rejeitar =
  async (req, res) => {
    try {
      const {
        motivo
      } = req.body;

      const rso =
        await RSO.findById(
          req.params.id
        );

      if (!rso) {
        return res
          .status(404)
          .json({
            message:
              "RSO não encontrado"
          });
      }

      const agora =
        new Date();

      /*
       * Mantemos o comportamento
       * atual do sistema:
       *
       * se o ADM rejeitar um RSO
       * ainda ativo, todos os
       * policiais são encerrados.
       */
      if (
        rso.status ===
        "Ativo"
      ) {
        encerrarTodosIntegrantes(
          rso,
          agora
        );

        await contabilizarHorasSeNecessario(
          rso
        );
      }

      rso.status =
        "Rejeitado";

      rso.comentarioADM =
        motivo || "";

      await rso.save();

      await logAction({
        action:
          "RSO REJEITADO",

        performedBy:
          req.user.id,

        details:
          `RSO ${rso._id} rejeitado`
      });

      return res.json({
        message:
          "RSO rejeitado com sucesso"
      });
    } catch (error) {
      console.error(
        "Erro ao rejeitar RSO:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            error.message
        });
    }
  };

/* =========================================================
   EDITAR HORÁRIO MANUAL DE MEMBRO
========================================================= */

exports.editarHorarioManual =
  async (req, res) => {
    try {
      const {
        tipoEquipe,
        cargo,
        index,
        horaEntrada,
        horaSaida
      } = req.body;

      const rso =
        await RSO.findById(
          req.params.id
        );

      if (!rso) {
        return res
          .status(404)
          .json({
            message:
              "RSO não encontrado"
          });
      }

      if (
        rso.status !==
        "Ativo"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Edição manual permitida apenas em RSO ativo"
          });
      }

      const membro =
        buscarMembroRSO(
          rso,
          tipoEquipe,
          cargo,
          index
        );

      if (!membro) {
        return res
          .status(404)
          .json({
            message:
              "Membro não encontrado no RSO"
          });
      }

      if (
        !horaEntrada ||
        !horaSaida
      ) {
        return res
          .status(400)
          .json({
            message:
              "Hora de entrada e saída são obrigatórias"
          });
      }

      const entrada =
        new Date(
          horaEntrada
        );

      const saida =
        new Date(
          horaSaida
        );

      if (
        Number.isNaN(
          entrada.getTime()
        ) ||
        Number.isNaN(
          saida.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Data ou horário inválido"
          });
      }

      if (
        saida <= entrada
      ) {
        return res
          .status(400)
          .json({
            message:
              "A hora de saída deve ser posterior à hora de entrada"
          });
      }

      membro.horaEntrada =
        entrada;

      membro.horaSaida =
        saida;

      membro.tempoMinutos =
        calcularMinutos(
          entrada,
          saida
        );

      membro.status =
        "Encerrado";

      await rso.save();

      await logAction({
        action:
          "EDIÇÃO MANUAL DE HORÁRIO EM RSO",

        performedBy:
          req.user.id,

        details:
          `RSO ${rso._id} | ${membro.nome} (${membro.funcional}) editado manualmente`
      });

      return res.json({
        message:
          "Horário atualizado manualmente",

        rso
      });
    } catch (error) {
      console.error(
        "Erro ao editar horário:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            error.message
        });
    }
  };

/* =========================================================
   ENCERRAR RSO MANUALMENTE PELO ADM
========================================================= */

exports.encerrarRSOManualmente =
  async (req, res) => {
    try {
      const {
        dataEncerramento
      } = req.body;

      const rso =
        await RSO.findById(
          req.params.id
        );

      if (!rso) {
        return res
          .status(404)
          .json({
            message:
              "RSO não encontrado"
          });
      }

      if (
        rso.status !==
        "Ativo"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Somente RSO ativo pode ser encerrado manualmente"
          });
      }

      const encerramento =
        dataEncerramento
          ? new Date(
              dataEncerramento
            )
          : new Date();

      if (
        Number.isNaN(
          encerramento.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Data de encerramento inválida"
          });
      }

      /* =========================
         ENCERRA TODOS

         NOVO + ANTIGO
      ========================= */

      encerrarTodosIntegrantes(
        rso,
        encerramento
      );

      rso.status =
        "Pendente";

      rso.encerradoManualmentePorADM =
        true;

      rso.nomeADMEncerramento =
        req.user.nome || "";

      rso.dataEncerramentoADM =
        encerramento;

      await rso.save();

      await logAction({
        action:
          "RSO ENCERRADO MANUALMENTE PELO ADM",

        performedBy:
          req.user.id,

        details:
          `RSO ${rso._id} encerrado manualmente`
      });

      return res.json({
        message:
          "RSO encerrado manualmente com sucesso",

        rso
      });
    } catch (error) {
      console.error(
        "Erro ao encerrar RSO manualmente:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            error.message
        });
    }
  };

/* =========================================================
   LISTAR RSOs ATIVOS
========================================================= */

exports.listAtivos =
  async (req, res) => {
    try {
      const ativos =
        await RSO.find({
          status:
            "Ativo"
        }).sort({
          createdAt: -1
        });

      return res.json(
        ativos
      );
    } catch (error) {
      console.error(
        "Erro ao listar RSOs ativos:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Erro ao buscar RSOs ativos"
        });
    }
  };