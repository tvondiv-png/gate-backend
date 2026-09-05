const {
  DISCIPLINARY_RULES,
  DISCIPLINARY_ATTENUANTS,
  DISCIPLINARY_AGGRAVANTS
} = require("../utils/disciplinaryRules");

exports.listRules = async (req, res) => {
  try {
    return res.json({
      rules: DISCIPLINARY_RULES,
      atenuantes: DISCIPLINARY_ATTENUANTS,
      agravantes: DISCIPLINARY_AGGRAVANTS
    });
  } catch (err) {
    console.error("Erro ao listar regras disciplinares:", err);
    return res.status(500).json({ message: "Erro ao listar regras disciplinares" });
  }
};