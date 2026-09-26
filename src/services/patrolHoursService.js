const PatrolHours = require("../models/PatrolHours");
const Hierarchy = require("../models/Hierarchy");

/**
 * ➕ REGISTRA HORAS (RSO APROVADO)
 * ⚠️ SÓ soma se o policial existir na hierarquia
 * `rocam: true` também soma nos contadores exclusivos de ROCAM
 * (usado quando o RSO é tipoPatrulhamento === "ROCAM").
 */
exports.registrarHoras = async (funcional, minutos, { rocam = false } = {}) => {
  if (!minutos || minutos <= 0) return;

  const existeNaHierarquia = await Hierarchy.findOne({ funcional });
  if (!existeNaHierarquia) return;

  const incremento = {
    horasSemanaMin: minutos,
    horasMesMin: minutos
  };

  if (rocam) {
    incremento.horasRocamSemanaMin = minutos;
    incremento.horasRocamMesMin = minutos;
  }

  await PatrolHours.findOneAndUpdate(
    { funcional },
    { $inc: incremento }
  );
};

