const Absence = require("../models/Absence");
const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");

module.exports = async function syncAbsences() {
  const hoje = new Date();

  const ausencias = await Absence.find({
    status: "Aprovada",
    dataFim: { $lt: hoje }
  });

  for (const a of ausencias) {
    // encerra ausência
    a.status = "Encerrada";
    await a.save();

    // reativa usuário
    await User.findByIdAndUpdate(a.policial, {
      status: "Ativo"
    });

    // reativa hierarquia
    await Hierarchy.findOneAndUpdate(
      { funcional: a.policialSnapshot.funcional },
      { status: "Ativo" }
    );
  }
};
