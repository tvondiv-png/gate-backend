const Conquista = require("../models/Conquista");

/* =========================================================
   Registra uma conquista de forma idempotente (não duplica
   se o usuário já tiver essa "chave"). Silencioso em caso de
   corrida (E11000) — outra requisição já registrou.
========================================================= */
async function registrarConquista({ user, tipo, titulo, descricao, chave }) {
  try {
    await Conquista.findOneAndUpdate(
      { user: user._id, chave },
      {
        $setOnInsert: {
          user: user._id,
          funcional: user.funcional,
          nome: user.nome,
          patente: user.patente,
          tipo,
          titulo,
          descricao,
          chave
        }
      },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) {
      console.error("Erro ao registrar conquista:", err.message);
    }
  }
}

module.exports = { registrarConquista };
