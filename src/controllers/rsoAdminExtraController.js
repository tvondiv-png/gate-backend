const RSO = require("../models/RSO");
const logAction = require("../utils/logAction");

/**
 * 📌 ESPELHO — LISTAR RSOs ATIVOS
 */
exports.listarAtivos = async (req, res) => {
  try {
    const rsos = await RSO.find({ status: "Ativo" })
      .sort({ createdAt: -1 });

    res.json(rsos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar RSOs ativos" });
  }
};

/**
 * 🔒 ENCERRAR RSO ATIVO (ADM)
 * Ativo → Pendente
 */
exports.encerrarAtivo = async (req, res) => {
  try {
    const rso = await RSO.findById(req.params.id);

    if (!rso || rso.status !== "Ativo") {
      return res.status(400).json({ message: "RSO não está ativo" });
    }

    rso.status = "Pendente";
    await rso.save();

    await logAction({
      action: "RSO ENCERRADO (ADM)",
      performedBy: req.user.id,
      details: `RSO ${rso._id} encerrado pelo ADM`
    });

    res.json({ message: "RSO encerrado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 🗑️ APAGAR RSO (APROVADO OU REJEITADO)
 */
exports.apagarRSO = async (req, res) => {
  try {
    const rso = await RSO.findById(req.params.id);

    if (!rso) {
      return res.status(404).json({ message: "RSO não encontrado" });
    }

    if (rso.status !== "Aprovado" && rso.status !== "Rejeitado") {
      return res.status(403).json({
        message: "Só é permitido apagar RSO aprovado ou rejeitado"
      });
    }

    await rso.deleteOne();

    await logAction({
      action: "RSO APAGADO",
      performedBy: req.user.id,
      details: `RSO ${rso._id} apagado`
    });

    res.json({ message: "RSO apagado definitivamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 🗑️ APAGAR TODO HISTÓRICO DE RSOs
 * Apenas Aprovado e Rejeitado
 */
exports.apagarHistoricoRSO = async (req, res) => {
  try {
    const resultado = await RSO.deleteMany({
      status: { $in: ["Aprovado", "Rejeitado"] }
    });

    await logAction({
      action: "RSO HISTÓRICO LIMPO",
      performedBy: req.user.id,
      details: `RSOs apagados: ${resultado.deletedCount}`
    });

    res.json({
      message: "Histórico de RSOs apagado com sucesso",
      totalApagados: resultado.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
