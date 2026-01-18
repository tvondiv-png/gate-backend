const PatrolHours = require("../models/PatrolHours");
const Hierarchy = require("../models/Hierarchy");

/**
 * 🔗 SINCRONIZA COMPLETAMENTE COM A HIERARQUIA ADM
 * - Cria quem não existe
 * - Atualiza nome, patente, status
 * - REMOVE quem saiu da hierarquia
 */
exports.syncAllFromHierarchy = async () => {
  const hierarquia = await Hierarchy.find().lean();

  const funcionaisAtivos = hierarquia.map(h => h.funcional);

  // cria ou atualiza quem está na hierarquia
  for (const h of hierarquia) {
    await PatrolHours.findOneAndUpdate(
      { funcional: h.funcional },
      {
        funcional: h.funcional,
        nome: h.nome,
        patente: h.patente,
        status: h.status
      },
      { upsert: true }
    );
  }

  // remove quem NÃO está mais na hierarquia
  await PatrolHours.deleteMany({
    funcional: { $nin: funcionaisAtivos }
  });
};

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

// =======================
// ZEROS
// =======================
exports.zerarSemana = async () => {
  await PatrolHours.updateMany({}, { horasSemanaMin: 0 });
};

exports.zerarMes = async () => {
  await PatrolHours.updateMany({}, { horasMesMin: 0 });
};

exports.listar = async () => {
  return PatrolHours.find().sort({ horasMesMin: -1 });
};
