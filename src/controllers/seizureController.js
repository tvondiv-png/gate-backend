const Seizure = require("../models/Seizure");

// 🔓 Público – usado no Home
exports.listPublic = async (req, res) => {
  const itens = await Seizure.find().sort({ tipo: 1 });
  res.json(itens);
};

// 🔐 Admin – listar
exports.listAdmin = async (req, res) => {
  const itens = await Seizure.find().sort({ tipo: 1 });
  res.json(itens);
};

// 🔐 Admin – zerar apreensões
exports.reset = async (req, res) => {
  await Seizure.updateMany({}, { quantidade: 0 });
  res.json({ message: "Apreensões zeradas com sucesso" });
};

// 🔧 Função interna – somar apreensões aprovadas
exports.somarApreensoes = async (apreensoes = []) => {
  for (const ap of apreensoes) {
    await Seizure.findOneAndUpdate(
      { tipo: ap.tipo },
      { $inc: { quantidade: ap.quantidade } },
      { upsert: true, new: true }
    );
  }
};
