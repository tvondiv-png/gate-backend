const Hierarchy = require("../models/Hierarchy");

/**
 * 🌐 Gera a hierarquia pública
 * ⚠️ NÃO usa JSX
 * ⚠️ NÃO renderiza HTML
 * ⚠️ APENAS retorna JSON
 */
exports.getPublicHierarchyData = async () => {
  const estrutura = {
    OFICIAIS_SUPERIORES: {
      categoria: "Oficiais Superiores",
      cor: "#c9a24d",
      membros: []
    },
    OFICIAIS_INTERMEDIARIOS: {
      categoria: "Oficiais Intermediários",
      cor: "#d4af37",
      membros: []
    },
    OFICIAIS_SUBALTERNOS: {
      categoria: "Oficiais Subalternos",
      cor: "#2e8b57",
      membros: []
    },
    PRACAS_ESPECIAIS: {
      categoria: "Praças Especiais",
      cor: "#8b5cf6",
      membros: []
    },
    PRACAS_GRADUADAS: {
      categoria: "Praças Graduadas",
      cor: "#b22222",
      membros: []
    },
    PRACAS: {
      categoria: "Praças",
      cor: "#808080",
      membros: []
    },
    ESTAGIARIOS: {
      categoria: "Estagiários",
      cor: "#6b7280",
      membros: []
    }
  };

  const registros = await Hierarchy.find({ status: "Ativo" })
    .sort({ patente: 1 })
    .lean();

  registros.forEach(r => {
    if (!estrutura[r.categoria]) return;

    estrutura[r.categoria].membros.push({
      funcional: r.funcional,
      nome: r.nome,
      patente: r.patente,
      funcao: r.funcao,
      cursos: r.cursos || [],
      medalhas: r.medalhas || [],
      status: r.status,
      dataEntrada: r.dataEntrada,
      ultimaPromocao: r.ultimaPromocao
    });
  });

  Object.keys(estrutura).forEach(key => {
    estrutura[key].total = estrutura[key].membros.length;
  });

  return estrutura; // ✅ SEM JSX
};
