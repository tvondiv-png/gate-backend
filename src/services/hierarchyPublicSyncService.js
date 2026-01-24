const Hierarchy = require("../models/Hierarchy");

/* ==========================
   ORDEM MILITAR CORRETA
========================== */
const ORDEM_PATENTE = {
  "CORONEL PM": 1,
  "TENENTE-CORONEL PM": 2,
  "MAJOR PM": 3,
  "CAPITAO PM": 4,
  "1º TENENTE PM": 5,
  "2º TENENTE PM": 6,
  "ASPIRANTE PM": 7,
  "SUBTENENTE PM": 8,
  "1º SARGENTO PM": 9,
  "2º SARGENTO PM": 10,
  "3º SARGENTO PM": 11,
  "CABO PM": 12,
  "SOLDADO 1ª CLASSE PM": 13,
  "SOLDADO 2ª CLASSE PM": 14
};

/* ==========================
   PRIORIDADE POR FUNÇÃO
========================== */
const PRIORIDADE_FUNCAO = {
  "Comando do Batalhão": 1,
  "Subcomando do Batalhão": 2
};

exports.getPublicHierarchyData = async () => {
  const estrutura = {
    OFICIAIS_SUPERIORES: { categoria: "Oficiais Superiores", cor: "#c9a24d", membros: [] },
    OFICIAIS_INTERMEDIARIOS: { categoria: "Oficiais Intermediários", cor: "#d4af37", membros: [] },
    OFICIAIS_SUBALTERNOS: { categoria: "Oficiais Subalternos", cor: "#2e8b57", membros: [] },
    PRACAS_ESPECIAIS: { categoria: "Praças Especiais", cor: "#8b5cf6", membros: [] },
    PRACAS_GRADUADAS: { categoria: "Praças Graduadas", cor: "#b22222", membros: [] },
    PRACAS: { categoria: "Praças", cor: "#808080", membros: [] },
    ESTAGIARIOS: { categoria: "Estagiarios", cor: "#6b7280", membros: [] }
  };

  const registros = await Hierarchy.find({ status: "Ativo" }).lean();

  registros.forEach(r => {
    if (!estrutura[r.categoria]) return;
    estrutura[r.categoria].membros.push(r);
  });

  Object.values(estrutura).forEach(cat => {
    cat.membros.sort((a, b) => {

      /* ===============================
         1️⃣ PRIORIDADE POR FUNÇÃO
      =============================== */
      const fa = PRIORIDADE_FUNCAO[a.funcao] || 99;
      const fb = PRIORIDADE_FUNCAO[b.funcao] || 99;

      if (fa !== fb) {
        return fa - fb;
      }

      /* ===============================
         2️⃣ PRIORIDADE POR PATENTE
      =============================== */
      const pa = (a.patente || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

      const pb = (b.patente || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

      return (ORDEM_PATENTE[pa] || 999) - (ORDEM_PATENTE[pb] || 999);
    });

    cat.total = cat.membros.length;
  });

  return estrutura;
};
