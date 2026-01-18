const Indication = require("../models/Indication");
const logAction = require("../utils/logAction");

// 👤 Usuário – criar indicação
exports.criarIndicacao = async (req, res) => {
  try {
    const {
      idPersonagem,
      nomePersonagem,
      idadeReal,
      cnh,
      discordId
    } = req.body;

    if (
      !idPersonagem ||
      !nomePersonagem ||
      !idadeReal ||
      !cnh ||
      !discordId
    ) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    const indication = await Indication.create({
      idPersonagem,
      nomePersonagem,
      idadeReal,
      cnh,
      discordId,
      criadoPor: req.user.id
    });

    await logAction({
      action: "ENVIO DE INDICAÇÃO",
      performedBy: req.user.id,
      targetUser: null,
      details: `Indicação ${indication._id} criada`
    });

    res.json(indication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao enviar indicação" });
  }
};

// 👤 Usuário – listar minhas indicações
exports.minhasIndicacoes = async (req, res) => {
  try {
    const indicacoes = await Indication.find({
      criadoPor: req.user.id
    }).sort({ createdAt: -1 });

    res.json(indicacoes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar indicações" });
  }
};
