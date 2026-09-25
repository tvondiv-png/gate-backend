/* =========================================================
   ASSISTENTE DE IA (Claude API)

   Usa a chave definida em ANTHROPIC_API_KEY. Se não estiver
   configurada, as funções abaixo lançam um erro claro em vez
   de tentar chamar a API — quem chama deve tratar isso como
   "recurso indisponível" (503), não como erro interno.

   Modelo padrão: claude-sonnet-5 (bom equilíbrio custo/
   qualidade para perguntas sobre regulamento e revisão de
   texto). Pode trocar via ANTHROPIC_MODEL no .env — por
   exemplo para "claude-opus-5" se quiser respostas mais
   sofisticadas e o custo maior for aceitável.
========================================================= */

let Anthropic = null;
let client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!client) {
    Anthropic = Anthropic || require("@anthropic-ai/sdk");
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

exports.assistenteDisponivel = () => !!process.env.ANTHROPIC_API_KEY;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/* =========================================================
   PERGUNTAR SOBRE O REGULAMENTO
========================================================= */
exports.perguntarRegulamento = async (pergunta, contextoRegulamentos) => {
  const c = getClient();
  if (!c) {
    const err = new Error("Assistente de IA não configurado (ANTHROPIC_API_KEY ausente)");
    err.indisponivel = true;
    throw err;
  }

  const system = [
    "Você é o assistente institucional do 2º BPChq Anchieta (unidade de RP em GTA V).",
    "Responda SOMENTE com base no texto dos regulamentos fornecido abaixo.",
    "Se a resposta não estiver no regulamento, diga claramente que não encontrou isso no regulamento e sugira procurar o Comando.",
    "Cite a parte/seção do regulamento quando possível (ex.: 'Parte 3: Doutrina e Conduta, Art. 3.4').",
    "Seja direto e objetivo — respostas curtas, em português, sem enrolação.",
    "Nunca invente regras que não estão no texto.",
    "",
    "=== REGULAMENTOS ===",
    contextoRegulamentos
  ].join("\n");

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 1200,
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: pergunta }]
  });

  const bloco = response.content.find((b) => b.type === "text");
  return bloco?.text || "";
};

/* =========================================================
   REVISAR / AJUDAR A REDIGIR BOPM
========================================================= */
exports.revisarBOPM = async (relato) => {
  const c = getClient();
  if (!c) {
    const err = new Error("Assistente de IA não configurado (ANTHROPIC_API_KEY ausente)");
    err.indisponivel = true;
    throw err;
  }

  const system = [
    "Você ajuda policiais do 2º BPChq Anchieta (RP em GTA V) a redigir o relato de um Boletim de Ocorrência (BOPM).",
    "Regras obrigatórias do regulamento para o relato:",
    "- Sem gírias, abreviações, códigos de ocorrência ou código quebec.",
    "- Descrever com o máximo de detalhes: tipo de abordagem, quem deu a ordem, o que foi feito, procedimentos após a detenção.",
    "- Se houver suspeito: vestimentas, características físicas (tatuagens, cor da pele, cabelo, barba, altura, porte físico).",
    "- Se houver veículo do suspeito: marca, modelo, cor, emplacamento.",
    "- Se houver ilícitos: listar tudo; dinheiro no formato 'R$ 4.407,00 em notas marcadas'.",
    "",
    "Responda em JSON válido, sem markdown, com este formato exato:",
    '{"relatoRevisado": "...", "observacoes": ["...", "..."]}',
    "'relatoRevisado' é o texto do relato já corrigido e formatado (mesmos fatos do rascunho, só a redação melhora).",
    "'observacoes' é uma lista curta do que foi corrigido ou do que falta o policial completar (ex.: informações que faltaram)."
  ].join("\n");

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 1500,
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: relato }]
  });

  const bloco = response.content.find((b) => b.type === "text");
  const texto = bloco?.text || "{}";

  try {
    return JSON.parse(texto);
  } catch {
    // se por algum motivo não veio um JSON limpo, devolve como texto corrido
    return { relatoRevisado: texto, observacoes: [] };
  }
};
