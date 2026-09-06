/* =========================================================
   Apaga definitivamente os regulamentos antigos (identidade
   "GATE"), preservando apenas os documentos atuais que
   começam com "Regulamento Interno".

   Uso:
     node src/scripts/apagarRegulamentosAntigos.js          -> lista o que seria apagado (dry-run)
     node src/scripts/apagarRegulamentosAntigos.js --apagar  -> apaga de fato
========================================================= */

require("dotenv").config();
const mongoose = require("mongoose");
const Regulation = require("../models/Regulation");

const APAGAR = process.argv.includes("--apagar");
const FILTRO = { titulo: { $not: /^Regulamento Interno/ } };

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado");

    const alvos = await Regulation.find(FILTRO)
      .select("titulo categoria publicado")
      .lean();

    console.log(`\n${alvos.length} regulamento(s) antigo(s):`);
    alvos.forEach((r) =>
      console.log(
        `  - [${r.categoria}] ${r.titulo}${r.publicado ? " (publicado!)" : ""}`
      )
    );

    const mantidos = await Regulation.countDocuments({
      titulo: /^Regulamento Interno/
    });
    console.log(`\n${mantidos} regulamento(s) atual(is) serão mantidos.`);

    if (!APAGAR) {
      console.log("\n(dry-run — rode com --apagar para excluir de fato)");
      process.exit(0);
    }

    const res = await Regulation.deleteMany(FILTRO);
    console.log(`\n🗑️  Apagados: ${res.deletedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err);
    process.exit(1);
  }
})();
