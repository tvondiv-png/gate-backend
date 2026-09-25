const PatrolHours = require("../models/PatrolHours");
const Hierarchy = require("../models/Hierarchy");

/**
 * ➕ REGISTRA HORAS (RSO APROVADO)
 * ⚠️ SÓ soma se o policial existir na hierarquia
 */
exports.registrarHoras = async (funcional, minutos) => {
  if (!minutos || minutos <= 0) return;

  const existeNaHierarquia = await Hierarchy.findOne({ funcional });
  if (!existeNaHierarquia) return;

  await PatrolHours.findOneAndUpdate(
    { funcional },
    {
      $inc: {
        horasSemanaMin: minutos,
        horasMesMin: minutos
      }
    }
  );
};

