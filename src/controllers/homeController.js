const HomeStats = require("../models/HomeStats");

exports.getHomeData = async (req, res) => {
  try {
    let stats = await HomeStats.findOne();

    if (!stats) {
      stats = await HomeStats.create({});
    }

    res.json(stats);
  } catch (err) {
    console.error("Erro ao buscar Home:", err);
    res.status(500).json({ message: "Erro ao carregar dados da home" });
  }
};