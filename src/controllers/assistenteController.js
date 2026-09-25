const Regulation = require("../models/Regulation");
const claudeService = require("../services/claudeService");

exports.status = (req, res) => {
  return res.json({ disponivel: claudeService.assistenteDisponivel() });
};

async function montarContextoRegulamentos() {
  const regs = await Regulation.find({ publicado: true })
    .select("titulo conteudo categoria")
    .sort({ categoria: 1, createdAt: 1 })
    .lean();

  return regs
    .map((r) => `## ${r.titulo}\n${r.conteudo}`)
    .join("\n\n---\n\n");
}

exports.perguntarRegulamento = async (req, res) => {
  try {
    if (!claudeService.assistenteDisponivel()) {
      return res.status(503).json({
        message:
          "Assistente de IA ainda não configurado. Peça ao Comando para configurar a chave da API."
      });
    }

    const { pergunta } = req.body;
    if (!pergunta || !pergunta.trim()) {
      return res.status(400).json({ message: "Digite uma pergunta" });
    }
    if (pergunta.length > 1000) {
      return res.status(400).json({ message: "Pergunta muito longa (máx. 1000 caracteres)" });
    }

    const contexto = await montarContextoRegulamentos();
    const resposta = await claudeService.perguntarRegulamento(pergunta.trim(), contexto);

    return res.json({ resposta });
  } catch (err) {
    if (err.indisponivel) {
      return res.status(503).json({ message: err.message });
    }
    console.error("Erro perguntarRegulamento:", err);
    return res.status(500).json({ message: "Erro ao consultar o assistente" });
  }
};

exports.revisarBOPM = async (req, res) => {
  try {
    if (!claudeService.assistenteDisponivel()) {
      return res.status(503).json({
        message:
          "Assistente de IA ainda não configurado. Peça ao Comando para configurar a chave da API."
      });
    }

    const { relato } = req.body;
    if (!relato || !relato.trim()) {
      return res.status(400).json({ message: "Cole o rascunho do relato" });
    }
    if (relato.length > 6000) {
      return res.status(400).json({ message: "Relato muito longo (máx. 6000 caracteres)" });
    }

    const resultado = await claudeService.revisarBOPM(relato.trim());
    return res.json(resultado);
  } catch (err) {
    if (err.indisponivel) {
      return res.status(503).json({ message: err.message });
    }
    console.error("Erro revisarBOPM:", err);
    return res.status(500).json({ message: "Erro ao revisar o relato" });
  }
};
