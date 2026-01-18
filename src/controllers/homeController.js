const HomeStats = require("../models/HomeStats");

// 🌐 PÚBLICO – DADOS DA HOME
exports.getHomeData = async (req, res) => {
  const stats = await HomeStats.findOne();
  res.json(
    stats || {
      apreensoes: {},
      policialDestaque: null
    }
  );
};
