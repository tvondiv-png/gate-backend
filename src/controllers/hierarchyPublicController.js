const { getPublicHierarchyData } = require("../services/hierarchyPublicSyncService");

/**
 * 🌐 HIERARQUIA PÚBLICA
 * Mantém o MESMO formato usado atualmente no frontend
 */
exports.publicHierarchy = async (req, res) => {
  try {
    const estrutura = await getPublicHierarchyData();
    res.json(estrutura);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro hierarquia pública" });
  }
};
