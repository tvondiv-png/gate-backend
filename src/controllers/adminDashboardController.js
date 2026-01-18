const PatrolHours = require("../models/PatrolHours");
const RSO = require("../models/RSO");
const SignupRequest = require("../models/SignupRequest");
const Absence = require("../models/Absence");
const Hierarchy = require("../models/Hierarchy");

exports.getDashboardData = async (req, res) => {
  try {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    // ======================
    // HORAS DO MÊS
    // ======================
    const horasMes = await PatrolHours.find({
      updatedAt: { $gte: inicioMes }
    });

    let totalMinutosMes = 0;
    let destaque = null;

    horasMes.forEach(h => {
      totalMinutosMes += h.horasMensais || 0;

      if (!destaque || h.horasMensais > destaque.horasMensais) {
        destaque = h;
      }
    });

    // ======================
    // DADOS DO POLICIAL DESTAQUE
    // ======================
    let policialDestaque = null;

    if (destaque) {
      const hier = await Hierarchy.findOne({
        funcional: destaque.funcional
      });

      policialDestaque = {
        funcional: destaque.funcional,
        nome: destaque.nome,
        patente: hier?.patente || "-",
        horas: destaque.horasMensais
      };
    }

    // ======================
    // PENDÊNCIAS
    // ======================
    const pendencias = {
      rsos: await RSO.countDocuments({ status: "Pendente" }),
      cadastros: await SignupRequest.countDocuments({ status: "Pendente" }),
      ausencias: await Absence.countDocuments({ status: "Pendente" })
    };

    res.json({
      totalHorasMes: totalMinutosMes,
      policialDestaque,
      pendencias
    });
  } catch (err) {
    console.error("Erro dashboard:", err);
    res.status(500).json({ message: "Erro dashboard" });
  }
};
