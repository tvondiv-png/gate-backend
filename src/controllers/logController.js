const Log = require("../models/Log");

// listar logs
exports.list = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("usuario", "nome email")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar logs" });
  }
};

// 🔴 ZERAR LOGS (admin / superadmin)
exports.clear = async (req, res) => {
  try {
    await Log.deleteMany({});
    res.json({ message: "Logs zerados com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao zerar logs" });
  }
};
