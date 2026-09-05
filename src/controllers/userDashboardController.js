const PatrolHours = require("../models/PatrolHours");
const Notification = require("../models/Notification");
const Action = require("../models/Action");
const { syncAllFromHierarchy } = require("../services/patrolHoursService");

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

    res.json({
      horas: {
        semana: minutosSemana,
        mes: minutosMes
      },
      notificacoesNaoLidas,
      totalAcoes
    });
  } catch (err) {
    console.error("Erro dashboard:", err);
    res.status(500).json({ message: "Erro ao carregar dashboard" });
  }
};