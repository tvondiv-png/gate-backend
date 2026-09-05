const RSO = require("../models/RSO");
const logAction = require("../utils/logAction");

/* =========================================================
   CALCULAR MINUTOS
========================================================= */

const calcularMinutos = (inicio, fim) => {
  if (!inicio || !fim) {
    return 0;
  }

  const diff =
    new Date(fim).getTime() -
    new Date(inicio).getTime();

  const minutos =
    Math.floor(diff / 60000);

  return minutos > 0
    ? minutos
    : 0;
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
    integrante.status !== "Ativo"
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

   Compatível com:

   NOVO:
   equipe[]

   ANTIGO:
   equipeFixa
   equipeRotativa
========================================================= */

const encerrarTodosIntegrantes = (
  rso,
  momento
) => {
  /* =========================
     NOVA EQUIPE
  ========================= */

  if (
    Array.isArray(rso?.equipe)
  ) {
    rso.equipe.forEach((p) => {
      encerrarIntegrante(
        p,
        momento
      );
    });
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
    .forEach((p) => {
      encerrarIntegrante(
        p,
        momento
      );
    });
};

/* =========================================================
   ESPELHO — LISTAR RSOs ATIVOS
========================================================= */

exports.listarAtivos = async (
  req,
  res
) => {
  try {
    const rsos =
      await RSO.find({
        status: "Ativo"
      }).sort({
        createdAt: -1
      });

    return res.json(rsos);
  } catch (error) {
    console.error(
      "Erro ao listar RSOs ativos:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Erro ao listar RSOs ativos"
      });
  }
};

/* =========================================================
   ENCERRAR RSO ATIVO PELO ADM

   Ativo → Pendente

   Agora também encerra todos os policiais ativos.
========================================================= */

exports.encerrarAtivo = async (
  req,
  res
) => {
  try {
    const rso =
      await RSO.findById(
        req.params.id
      );

    if (
      !rso ||
      rso.status !== "Ativo"
    ) {
      return res
        .status(400)
        .json({
          message:
            "RSO não está ativo"
        });
    }

    const agora =
      new Date();

    encerrarTodosIntegrantes(
      rso,
      agora
    );

    rso.status =
      "Pendente";

    rso.encerradoManualmentePorADM =
      true;

    rso.nomeADMEncerramento =
      req.user?.nome || "";

    rso.dataEncerramentoADM =
      agora;

    await rso.save();

    await logAction({
      action:
        "RSO ENCERRADO (ADM)",

      performedBy:
        req.user.id,

      details:
        `RSO ${rso._id} encerrado pelo ADM | Tipo: ${
          rso.tipoPatrulhamento ||
          "VIATURA"
        } | Viatura: ${
          rso.viatura || "-"
        }`
    });

    return res.json({
      message:
        "RSO encerrado com sucesso",

      rso
    });
  } catch (error) {
    console.error(
      "Erro ao encerrar RSO pelo ADM:",
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
   APAGAR RSO

   Somente:
   - Aprovado
   - Rejeitado
========================================================= */

exports.apagarRSO = async (
  req,
  res
) => {
  try {
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
      rso.status !== "Aprovado" &&
      rso.status !== "Rejeitado"
    ) {
      return res
        .status(403)
        .json({
          message:
            "Só é permitido apagar RSO aprovado ou rejeitado"
        });
    }

    await rso.deleteOne();

    await logAction({
      action:
        "RSO APAGADO",

      performedBy:
        req.user.id,

      details:
        `RSO ${rso._id} apagado`
    });

    return res.json({
      message:
        "RSO apagado definitivamente"
    });
  } catch (error) {
    console.error(
      "Erro ao apagar RSO:",
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
   APAGAR TODO HISTÓRICO DE RSOs

   Remove somente:
   - Aprovado
   - Rejeitado

   Não remove:
   - Ativo
   - Pendente
========================================================= */

exports.apagarHistoricoRSO =
  async (req, res) => {
    try {
      const resultado =
        await RSO.deleteMany({
          status: {
            $in: [
              "Aprovado",
              "Rejeitado"
            ]
          }
        });

      await logAction({
        action:
          "RSO HISTÓRICO LIMPO",

        performedBy:
          req.user.id,

        details:
          `RSOs apagados: ${resultado.deletedCount}`
      });

      return res.json({
        message:
          "Histórico de RSOs apagado com sucesso",

        totalApagados:
          resultado.deletedCount
      });
    } catch (error) {
      console.error(
        "Erro ao limpar histórico de RSO:",
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