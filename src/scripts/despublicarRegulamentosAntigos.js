/* =========================================================
   Despublica os regulamentos antigos (versão "GATE",
   divididos seção a seção), mantendo publicados apenas os
   documentos oficiais atuais que começam com
   "Regulamento Interno".

   NÃO apaga nada — só marca publicado:false. Reversível
   pelo painel /admin/regulamentos.

   Uso: node src/scripts/despublicarRegulamentosAntigos.js
========================================================= */

require("dotenv").config();
const mongoose = require("mongoose");
const Regulation = require("../models/Regulation");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado");

    const res = await Regulation.updateMany(
      {
        publicado: true,
        titulo: { $not: /^Regulamento Interno/ }
      },
      { $set: { publicado: false } }
    );

    console.log(`↓ despublicados: ${res.modifiedCount}`);

    const publicados = await Regulation.find({ publicado: true }).select("categoria titulo");
    console.log(`\nAgora publicados (${publicados.length}):`);
    publicados.forEach((r) => console.log(" -", r.categoria, "|", r.titulo));

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err);
    process.exit(1);
  }
})();
