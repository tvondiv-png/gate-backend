const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");
const PatrolHours = require("../models/PatrolHours");
const Advertencia = require("../models/Advertencia");
const Notification = require("../models/Notification");
const RSO = require("../models/RSO");
const RSOHistory = require("../models/RSOHistory");

const META_SEMANAL = 360; // 6 horas = 360 minutos

/* =========================================================
   STATUS OPERACIONAL
========================================================= */

const calcularStatus = (horasSemana) => {
  if (horasSemana >= META_SEMANAL) {
    return "Regular";
  }

  if (horasSemana > 0) {
    return "Atenção";
  }

  return "Irregular";
};

/* =========================================================
   COMPARAR FUNCIONAL

   Evita problema entre:
   123
   "123"
========================================================= */

const mesmaFuncional = (a, b) => {
  return (
    Number(a) > 0 &&
    Number(b) > 0 &&
    Number(a) === Number(b)
  );
};

/* =========================================================
   VERIFICAR SE POLICIAL ESTÁ NO RSO

   COMPATÍVEL COM:

   NOVO:
   - equipe[]

   ANTIGO:
   - equipeFixa
   - equipeRotativa
========================================================= */

const policialEstaNoRSO = (rso, funcional) => {
  if (!rso) {
    return false;
  }

  /* =====================================================
     NOVA EQUIPE DINÂMICA
  ===================================================== */

  if (Array.isArray(rso.equipe)) {
    const encontradoNovaEquipe =
      rso.equipe.some((p) =>
        mesmaFuncional(
          p?.funcional,
          funcional
        )
      );

    if (encontradoNovaEquipe) {
      return true;
    }
  }

  /* =====================================================
     EQUIPE FIXA ANTIGA
  ===================================================== */

  if (
    mesmaFuncional(
      rso.equipeFixa?.chefe?.funcional,
      funcional
    )
  ) {
    return true;
  }

  if (
    mesmaFuncional(
      rso.equipeFixa?.auxiliar?.funcional,
      funcional
    )
  ) {
    return true;
  }

  /* =====================================================
     EQUIPE ROTATIVA ANTIGA
  ===================================================== */

  const listasRotativas =
    Object.values(
      rso.equipeRotativa || {}
    );

  for (const lista of listasRotativas) {
    if (!Array.isArray(lista)) {
      continue;
    }

    const encontrado =
      lista.some((p) =>
        mesmaFuncional(
          p?.funcional,
          funcional
        )
      );

    if (encontrado) {
      return true;
    }
  }

  return false;
};

/* =========================================================
   BUSCAR CARGO DO POLICIAL NO RSO
========================================================= */

const buscarCargoNoRSO = (
  rso,
  funcional
) => {
  if (!rso) {
    return null;
  }

  /* NOVA EQUIPE */

  if (Array.isArray(rso.equipe)) {
    const integrante =
      rso.equipe.find((p) =>
        mesmaFuncional(
          p?.funcional,
          funcional
        )
      );

    if (integrante) {
      return integrante.cargo || null;
    }
  }

  /* EQUIPE FIXA ANTIGA */

  if (
    mesmaFuncional(
      rso.equipeFixa?.chefe?.funcional,
      funcional
    )
  ) {
    return (
      rso.equipeFixa.chefe.cargo ||
      "Chefe"
    );
  }

  if (
    mesmaFuncional(
      rso.equipeFixa?.auxiliar?.funcional,
      funcional
    )
  ) {
    return (
      rso.equipeFixa.auxiliar.cargo ||
      "Auxiliar"
    );
  }

  /* EQUIPE ROTATIVA ANTIGA */

  for (
    const [cargoLista, lista] of
    Object.entries(
      rso.equipeRotativa || {}
    )
  ) {
    if (!Array.isArray(lista)) {
      continue;
    }

    const integrante =
      lista.find((p) =>
        mesmaFuncional(
          p?.funcional,
          funcional
        )
      );

    if (integrante) {
      return (
        integrante.cargo ||
        cargoLista ||
        null
      );
    }
  }

  return null;
};

/* =========================================================
   CONSULTA POLICIAL
========================================================= */

exports.buscarPolicial = async (
  req,
  res
) => {
  try {
    const funcional =
      Number(
        req.params.funcional
      );

    if (!funcional) {
      return res
        .status(400)
        .json({
          message:
            "Funcional inválida"
        });
    }

    /* =====================================================
       USER
    ===================================================== */

    const user =
      await User.findOne({
        funcional
      });

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Policial não encontrado"
        });
    }

    /* =====================================================
       HIERARQUIA
    ===================================================== */

    const hierarchy =
      await Hierarchy.findOne({
        funcional
      });

    /* =====================================================
       HORAS
    ===================================================== */

    const horas =
      await PatrolHours.findOne({
        funcional
      });

    const horasSemana =
      horas?.horasSemanaMin || 0;

    const horasMes =
      horas?.horasMesMin || 0;

    /* =====================================================
       ÚLTIMO RSO

       Procura nos RSOs normais.
       Agora reconhece equipe[] nova.
    ===================================================== */

    const rsosRecentes =
      await RSO.find({})
        .sort({
          createdAt: -1
        })
        .limit(300)
        .lean();

    const ultimoRSOEncontrado =
      rsosRecentes.find((rso) =>
        policialEstaNoRSO(
          rso,
          funcional
        )
      );

    const ultimoRSO =
      ultimoRSOEncontrado
        ? {
            _id:
              ultimoRSOEncontrado._id,

            tipoPatrulhamento:
              ultimoRSOEncontrado.tipoPatrulhamento ||
              "VIATURA",

            viatura:
              ultimoRSOEncontrado.viatura ||
              "-",

            cargo:
              buscarCargoNoRSO(
                ultimoRSOEncontrado,
                funcional
              ),

            status:
              ultimoRSOEncontrado.status ||
              "-",

            data:
              ultimoRSOEncontrado.createdAt ||
              null
          }
        : null;

    /* =====================================================
       ÚLTIMA PATRULHA APROVADA

       Vem do RSOHistory.

       Agora:
       - reconhece equipe[] nova
       - retorna viatura
       - retorna ROCAM / VIATURA
       - cargo
       - data
    ===================================================== */

    const historicosRecentes =
      await RSOHistory.find({})
        .sort({
          dataAprovacao: -1,
          createdAt: -1
        })
        .limit(500)
        .lean();

    const ultimaPatrulhaHistorico =
      historicosRecentes.find(
        (hist) =>
          policialEstaNoRSO(
            hist,
            funcional
          )
      );

    const ultimaPatrulha =
      ultimaPatrulhaHistorico
        ? {
            _id:
              ultimaPatrulhaHistorico._id,

            tipoPatrulhamento:
              ultimaPatrulhaHistorico.tipoPatrulhamento ||
              "VIATURA",

            viatura:
              ultimaPatrulhaHistorico.viatura ||
              "-",

            cargo:
              buscarCargoNoRSO(
                ultimaPatrulhaHistorico,
                funcional
              ),

            status:
              "Aprovado",

            data:
              ultimaPatrulhaHistorico.dataAprovacao ||
              ultimaPatrulhaHistorico.createdAt ||
              null
          }
        : null;

    /* =====================================================
       ADVERTÊNCIA ATIVA
    ===================================================== */

    const advertenciaAtiva =
      await Advertencia.findOne({
        policial:
          user._id,

        ativa:
          true
      }).sort({
        createdAt: -1
      });

    /* =====================================================
       HISTÓRICO DE ADVERTÊNCIAS
    ===================================================== */

    const historicoAdvertencias =
      await Advertencia.find({
        policial:
          user._id
      })
        .sort({
          createdAt: -1
        })
        .select(
          "tipo semanaReferencia motivo ativa createdAt"
        );

    /* =====================================================
       NOTIFICAÇÕES
    ===================================================== */

    const notificacoes =
      await Notification.find({
        user:
          user._id
      }).sort({
        createdAt: -1
      });

    const naoLidas =
      notificacoes.filter(
        (n) => !n.read
      ).length;

    /* =====================================================
       ÚLTIMOS RSOs

       Agora também informa:
       - tipo
       - cargo
    ===================================================== */

    const ultimosRSOs =
      rsosRecentes
        .filter((rso) =>
          policialEstaNoRSO(
            rso,
            funcional
          )
        )
        .slice(0, 5)
        .map((rso) => ({
          _id:
            rso._id,

          tipoPatrulhamento:
            rso.tipoPatrulhamento ||
            "VIATURA",

          viatura:
            rso.viatura ||
            "-",

          cargo:
            buscarCargoNoRSO(
              rso,
              funcional
            ),

          status:
            rso.status ||
            "-",

          createdAt:
            rso.createdAt ||
            null,

          observacoes:
            rso.observacoes ||
            ""
        }));

    /* =====================================================
       RESPOSTA
    ===================================================== */

    return res.json({
      funcional:
        user.funcional,

      nome:
        user.nome,

      patente:
        user.patente ||
        hierarchy?.patente ||
        "-",

      dataEntrada:
        hierarchy?.dataEntrada ||
        user?.dataEntrada ||
        null,

      dataUltimaPromocao:
        hierarchy?.dataUltimaPromocao ||
        user?.dataUltimaPromocao ||
        null,

      cursos:
        hierarchy?.cursos ||
        user?.cursos ||
        [],

      medalhas:
        hierarchy?.medalhas ||
        [],

      qualificacaoRocam:
        hierarchy?.qualificacaoRocam ||
        "NENHUM",

      horasSemana,

      horasMes,

      metaSemanal:
        META_SEMANAL,

      faltante:
        Math.max(
          META_SEMANAL -
            horasSemana,
          0
        ),

      statusOperacional:
        calcularStatus(
          horasSemana
        ),

      /*
       * Agora ultimaPatrulha
       * é um OBJETO.
       */
      ultimaPatrulha,

      ultimoRSO,

      advertenciaAtiva:
        !!advertenciaAtiva,

      tipoAdvertencia:
        advertenciaAtiva?.tipo ||
        null,

      historicoAdvertencias,

      totalNotificacoes:
        notificacoes.length,

      notificacoesNaoLidas:
        naoLidas,

      ultimosRSOs
    });
  } catch (err) {
    console.error(
      "Erro na consulta policial:",
      err
    );

    return res
      .status(500)
      .json({
        message:
          "Erro na consulta policial"
      });
  }
};