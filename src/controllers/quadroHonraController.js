const PatrolHours = require("../models/PatrolHours");
const Hierarchy = require("../models/Hierarchy");
const Conquista = require("../models/Conquista");

/* =========================================================
   QUADRO DE HONRA — PÚBLICO

   Destaque do mês, da semana, top 3 do mês e as conquistas
   mais recentes do efetivo (metas batidas, sequências).
========================================================= */
exports.getQuadroHonra = async (req, res) => {
  try {
    const montarDestaque = async (campo) => {
      const doc = await PatrolHours.findOne({ [campo]: { $gt: 0 } })
        .sort({ [campo]: -1 })
        .lean();
      if (!doc) return null;

      const hier = await Hierarchy.findOne({ funcional: doc.funcional })
        .select("patente")
        .lean();

      return {
        funcional: doc.funcional,
        nome: doc.nome,
        patente: hier?.patente || doc.patente,
        horas: Math.round(((doc[campo] || 0) / 60) * 10) / 10
      };
    };

    const [destaqueMes, destaqueSemana] = await Promise.all([
      montarDestaque("horasMesMin"),
      montarDestaque("horasSemanaMin")
    ]);

    const topMesRaw = await PatrolHours.find({ horasMesMin: { $gt: 0 } })
      .sort({ horasMesMin: -1 })
      .limit(3)
      .lean();

    const topMes = await Promise.all(
      topMesRaw.map(async (p) => {
        const hier = await Hierarchy.findOne({ funcional: p.funcional })
          .select("patente")
          .lean();
        return {
          funcional: p.funcional,
          nome: p.nome,
          patente: hier?.patente || p.patente,
          horas: Math.round(((p.horasMesMin || 0) / 60) * 10) / 10
        };
      })
    );

    const conquistasRecentes = await Conquista.find()
      .sort({ createdAt: -1 })
      .limit(12)
      .select("nome patente tipo titulo createdAt")
      .lean();

    return res.json({
      destaqueMes,
      destaqueSemana,
      topMes,
      conquistasRecentes
    });
  } catch (err) {
    console.error("Erro getQuadroHonra:", err);
    return res.status(500).json({ message: "Erro ao carregar o quadro de honra" });
  }
};
