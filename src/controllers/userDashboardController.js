const PatrolHours = require("../models/PatrolHours");
const PatrolHoursHistory = require("../models/PatrolHoursHistory");
const Notification = require("../models/Notification");
const Action = require("../models/Action");
const Conquista = require("../models/Conquista");
const { syncAllFromHierarchy } = require("../services/patrolHoursService");
const { registrarConquista } = require("../utils/conquistas");

const MINIMO_PATRULHA_SEMANAL_MIN = 360; // 6h

/* Conta semanas consecutivas (mais recente pra trás) em que o
   policial bateu a meta mínima de patrulhamento semanal. */
async function calcularSequenciaSemanas(funcional) {
  const historico = await PatrolHoursHistory.find({
    funcional,
    tipoRegistro: "reset_week"
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .select("horasSemanaMin")
    .lean();

  let sequencia = 0;
  for (const h of historico) {
    if ((h.horasSemanaMin || 0) >= MINIMO_PATRULHA_SEMANAL_MIN) {
      sequencia++;
    } else {
      break;
    }
  }
  return sequencia;
}

exports.getMyDashboard = async (req, res) => {
  try {
    await syncAllFromHierarchy();

    const funcional = req.user.funcional;

    const horas = await PatrolHours.findOne({ funcional });

    const notificacoesNaoLidas = await Notification.countDocuments({
      user: req.user.id,
      lida: false
    });

    const totalAcoes = await Action.countDocuments({
      "participantes.userId": req.user._id,
      status: "APROVADA",
      excluidoHistorico: false
    });

    const minutosSemana = horas?.horasSemanaMin || 0;
    const minutosMes = horas?.horasMesMin || 0;

    const sequenciaSemanas = await calcularSequenciaSemanas(funcional);

    if (sequenciaSemanas > 0 && sequenciaSemanas % 4 === 0) {
      await registrarConquista({
        user: req.user,
        tipo: "SEQUENCIA_SEMANAS",
        titulo: `${sequenciaSemanas} semanas seguidas na meta`,
        descricao: `Cumpriu a meta mínima de patrulhamento por ${sequenciaSemanas} semanas consecutivas.`,
        chave: `sequencia:${sequenciaSemanas}`
      });
    }

    const conquistas = await Conquista.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("tipo titulo descricao createdAt")
      .lean();

    res.json({
      horas: {
        semana: minutosSemana,
        mes: minutosMes
      },
      notificacoesNaoLidas,
      totalAcoes,
      sequenciaSemanas,
      conquistas
    });
  } catch (err) {
    console.error("Erro dashboard:", err);
    res.status(500).json({ message: "Erro ao carregar dashboard" });
  }
};
