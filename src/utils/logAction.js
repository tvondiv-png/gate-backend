const Log = require("../models/Log");

const logAction = async (data = {}) => {
  // 🧠 compatibilidade com padrão antigo
  const usuario = data.usuario || data.performedBy;
  const acao = data.acao || data.action;
  const modulo = data.modulo || "GERAL";
  const alvoId = data.alvoId || data.targetUser || null;
  const detalhes = data.detalhes || data.details || "";

  if (!usuario || !acao || !modulo) {
    console.warn("Log ignorado por dados incompletos:", {
      usuario,
      acao,
      modulo
    });
    return;
  }

  try {
    await Log.create({
      usuario,
      acao,
      modulo,
      alvoId,
      detalhes
    });
  } catch (err) {
    console.error("Erro ao registrar log:", err.message);
  }
};

module.exports = logAction;
