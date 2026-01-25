const PatrolHours = require("../models/PatrolHours");
const Notification = require("../models/Notification");

exports.getUserDashboard = async (req, res) => {
  try {
    const funcional = req.user.funcional;

    const horas = await PatrolHours.findOne({ funcional });

    const notificacoesNaoLidas = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({
      horas: {
        semana: horas?.horasSemanaMin || 0,
        mes: horas?.horasMesMin || 0
      },
      notificacoesNaoLidas
    });
  } catch (error) {
    console.error("Erro dashboard usuário:", error);
    res.status(500).json({ message: "Erro ao carregar dashboard" });
  }
};
