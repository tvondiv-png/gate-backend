const HistoriaAnchieta = require("../models/HistoriaAnchieta");
const seed = require("../data/historiaAnchietaSeed");

/* =========================================================
   Garante que o documento único exista.
   Na primeira leitura, cria com o conteúdo padrão.
========================================================= */
async function obterOuCriar() {
  let doc = await HistoriaAnchieta.findOne({ chave: "PRINCIPAL" });

  if (!doc) {
    doc = await HistoriaAnchieta.create({
      chave: "PRINCIPAL",
      titulo: seed.titulo,
      resumo: seed.resumo,
      secoes: seed.secoes
    });
  }

  return doc;
}

/* =========================================================
   PÚBLICO — GET /api/historia
========================================================= */
exports.getHistoria = async (req, res) => {
  try {
    const doc = await obterOuCriar();
    return res.json(doc);
  } catch (err) {
    console.error("Erro ao carregar história:", err);
    return res.status(500).json({ message: "Erro ao carregar a história" });
  }
};

/* =========================================================
   ADMIN / SUPERADMIN — PUT /api/historia
========================================================= */
exports.updateHistoria = async (req, res) => {
  try {
    const doc = await obterOuCriar();

    const { titulo, resumo, secoes } = req.body;

    if (titulo !== undefined) {
      doc.titulo = String(titulo).trim() || doc.titulo;
    }

    if (resumo !== undefined) {
      doc.resumo = String(resumo);
    }

    if (Array.isArray(secoes)) {
      doc.secoes = secoes
        .filter((s) => s && String(s.titulo || "").trim())
        .map((s) => ({
          titulo: String(s.titulo).trim(),
          corpo: String(s.corpo || "")
        }));
    }

    doc.atualizadoPor = req.user?.id || null;
    await doc.save();

    return res.json(doc);
  } catch (err) {
    console.error("Erro ao atualizar história:", err);
    return res.status(500).json({ message: "Erro ao salvar a história" });
  }
};

/* =========================================================
   ADMIN / SUPERADMIN — POST /api/historia/restaurar
   Volta ao conteúdo padrão do documento institucional.
========================================================= */
exports.restaurarPadrao = async (req, res) => {
  try {
    const doc = await obterOuCriar();

    doc.titulo = seed.titulo;
    doc.resumo = seed.resumo;
    doc.secoes = seed.secoes;
    doc.atualizadoPor = req.user?.id || null;
    await doc.save();

    return res.json(doc);
  } catch (err) {
    console.error("Erro ao restaurar história:", err);
    return res.status(500).json({ message: "Erro ao restaurar a história" });
  }
};
