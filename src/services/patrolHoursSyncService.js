const PatrolHours = require("../models/PatrolHours");

/**
 * Sincroniza dados vindos da Hierarquia
 * NÃO usa top-level await
 * 100% CommonJS
 */
const syncFromHierarchy = async (hierarchy) => {
  const funcional = hierarchy.funcional;
  const nome = hierarchy.nome;
  const patente = hierarchy.patente;
  const status = hierarchy.status || "Ativo";

  const registro = await PatrolHours.findOne({ funcional });

  if (!registro) {
    await PatrolHours.create({
      funcional,
      nome,
      patente,
      status,
      horasSemanaMin: 0,
      horasMesMin: 0
    });
  } else {
    registro.nome = nome;
    registro.patente = patente;
    registro.status = status;
    await registro.save();
  }
};

module.exports = {
  syncFromHierarchy
};
