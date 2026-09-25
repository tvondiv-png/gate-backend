const RocamProfile = require("../models/RocamProfile");
const RocamStage = require("../models/RocamStage");
const RocamEvaluation = require("../models/RocamEvaluation");

const STATUS_ESTAGIO_ABERTO = [
  "EM_ANDAMENTO",
  "APTO_APROVACAO",
  "APROVACAO_SOLICITADA"
];

function inicioMes() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

/* =========================================================
   GRÁFICOS ROCAM — COMANDO
========================================================= */

exports.getGraficos = async (req, res) => {
  try {
    const desde = inicioMes();

    /* -----------------------------------------------------
       PROGRESSO DOS ESTAGIÁRIOS ATIVOS
    ----------------------------------------------------- */

    const estagiosAtivos = await RocamStage.find({
      status: { $in: STATUS_ESTAGIO_ABERTO }
    })
      .select("user funcional status progresso dataInicio")
      .sort({ "progresso.percentualGeral": -1 })
      .lean();

    const userIdsAtivos = estagiosAtivos.map((item) => item.user);

    const perfisAtivos = await RocamProfile.find({
      user: { $in: userIdsAtivos }
    })
      .select("user nome patente")
      .lean();

    const perfilPorUser = new Map(
      perfisAtivos.map((item) => [String(item.user), item])
    );

    const progressoEstagiarios = estagiosAtivos.map((item) => ({
      nome: perfilPorUser.get(String(item.user))?.nome || "-",
      patente: perfilPorUser.get(String(item.user))?.patente || "",
      percentual: Number(item.progresso?.percentualGeral || 0),
      status: item.status
    }));

    /* -----------------------------------------------------
       AVALIAÇÕES POR BRAÇAL (NO MÊS)
    ----------------------------------------------------- */

    const avaliacoesPorBracalRaw = await RocamEvaluation.aggregate([
      { $match: { dataAvaliacao: { $gte: desde } } },
      {
        $group: {
          _id: "$evaluatorUser",
          nome: { $first: "$nomeAvaliador" },
          total: { $sum: 1 },
          mediaNota: { $avg: "$notaPercentual" }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    const avaliacoesPorBracal = avaliacoesPorBracalRaw.map((item) => ({
      nome: item.nome,
      total: item.total,
      mediaNota: Number((item.mediaNota || 0).toFixed(1))
    }));

    /* -----------------------------------------------------
       STATUS FINAL DOS ESTÁGIOS (TODOS)
    ----------------------------------------------------- */

    const statusRaw = await RocamStage.aggregate([
      {
        $match: {
          status: {
            $in: ["APROVADO", "REPROVADO", "CANCELADO", "DESLIGADO"]
          }
        }
      },
      { $group: { _id: "$status", total: { $sum: 1 } } }
    ]);

    const statusEstagios = statusRaw.map((item) => ({
      status: item._id,
      total: item.total
    }));

    /* -----------------------------------------------------
       TEMPO MÉDIO DE APROVAÇÃO (DIAS)
    ----------------------------------------------------- */

    const aprovados = await RocamStage.find({
      status: "APROVADO",
      dataConclusao: { $ne: null }
    })
      .select("dataInicio dataConclusao")
      .lean();

    const tempoMedioAprovacaoDias =
      aprovados.length > 0
        ? Number(
            (
              aprovados.reduce((acc, item) => {
                const dias =
                  (new Date(item.dataConclusao) - new Date(item.dataInicio)) /
                  (1000 * 60 * 60 * 24);
                return acc + dias;
              }, 0) / aprovados.length
            ).toFixed(1)
          )
        : 0;

    return res.json({
      progressoEstagiarios,
      avaliacoesPorBracal,
      statusEstagios,
      tempoMedioAprovacaoDias,
      totalAprovadosConsiderados: aprovados.length
    });
  } catch (err) {
    console.error("Erro getGraficos ROCAM:", err);

    return res.status(500).json({
      message: "Erro ao carregar gráficos ROCAM"
    });
  }
};

/* =========================================================
   QUADRO DE HONRA ROCAM
========================================================= */

exports.getQuadroHonra = async (req, res) => {
  try {
    const desde = inicioMes();

    /* -----------------------------------------------------
       BRAÇAL MAIS ATIVO DO MÊS (MAIS AVALIAÇÕES)
    ----------------------------------------------------- */

    const topBracais = await RocamEvaluation.aggregate([
      { $match: { dataAvaliacao: { $gte: desde } } },
      {
        $group: {
          _id: "$evaluatorUser",
          nome: { $first: "$nomeAvaliador" },
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 3 }
    ]);

    /* -----------------------------------------------------
       ESTAGIÁRIO DESTAQUE (MAIOR PROGRESSO ATIVO)
    ----------------------------------------------------- */

    const estagiosAtivos = await RocamStage.find({
      status: { $in: STATUS_ESTAGIO_ABERTO }
    })
      .select("user progresso")
      .sort({ "progresso.percentualGeral": -1 })
      .limit(3)
      .lean();

    const perfis = await RocamProfile.find({
      user: { $in: estagiosAtivos.map((item) => item.user) }
    })
      .select("user nome patente")
      .lean();

    const perfilPorUser = new Map(
      perfis.map((item) => [String(item.user), item])
    );

    const estagiariosDestaque = estagiosAtivos.map((item) => ({
      nome: perfilPorUser.get(String(item.user))?.nome || "-",
      patente: perfilPorUser.get(String(item.user))?.patente || "",
      percentual: Number(item.progresso?.percentualGeral || 0)
    }));

    return res.json({
      bracaisAtivos: topBracais.map((item) => ({
        nome: item.nome,
        total: item.total
      })),
      estagiariosDestaque
    });
  } catch (err) {
    console.error("Erro getQuadroHonra ROCAM:", err);

    return res.status(500).json({
      message: "Erro ao carregar Quadro de Honra ROCAM"
    });
  }
};
