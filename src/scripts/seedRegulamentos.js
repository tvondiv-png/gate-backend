/* =========================================================
   Carrega/atualiza os regulamentos oficiais.

   Uso:  node src/scripts/seedRegulamentos.js

   Idempotente: casa pelo título; se já existe, atualiza
   descrição/conteúdo/categoria e mantém publicado. Se não
   existe, cria já publicado.
========================================================= */

require("dotenv").config();
const mongoose = require("mongoose");
const Regulation = require("../models/Regulation");
const User = require("../models/User");
const dados = require("../data/regulamentosSeed");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado");

    const autor =
      (await User.findOne({ role: "superadmin" })) ||
      (await User.findOne({ role: "admin" }));

    if (!autor) {
      console.error("❌ Nenhum superadmin/admin encontrado para 'criadoPor'.");
      process.exit(1);
    }

    let criados = 0;
    let atualizados = 0;

    for (const r of dados) {
      const existente = await Regulation.findOne({ titulo: r.titulo });

      if (existente) {
        existente.descricao = r.descricao || existente.descricao;
        existente.conteudo = r.conteudo;
        existente.categoria = r.categoria;
        existente.publicado = true;
        await existente.save();
        atualizados++;
        console.log("↻ atualizado:", r.titulo);
      } else {
        await Regulation.create({
          titulo: r.titulo,
          descricao: r.descricao || "",
          conteudo: r.conteudo,
          categoria: r.categoria,
          publicado: true,
          criadoPor: autor._id
        });
        criados++;
        console.log("＋ criado:", r.titulo);
      }
    }

    console.log(`\n✅ Concluído. Criados: ${criados}, atualizados: ${atualizados}.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err);
    process.exit(1);
  }
})();
