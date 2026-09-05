const Hierarchy = require("../models/Hierarchy");

const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante a Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

function normalizarCategoria(categoria) {
  if (!categoria) return categoria;

  return categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");
}

exports.publicHierarchy = async (req, res) => {
  try {
    const hierarchy = await Hierarchy.find({ status: "Ativo" }).lean();

    const agrupado = {};

    hierarchy.forEach((h) => {
      const categoria = normalizarCategoria(h.categoria);

      if (!agrupado[categoria]) {
        agrupado[categoria] = {
          categoria,
          cor: h.cor,
          total: 0,
          membros: []
        };
      }

      agrupado[categoria].total++;
      agrupado[categoria].membros.push(h);
    });

    return res.json(agrupado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro hierarquia pública" });
  }
};

exports.publicHierarchyList = async (req, res) => {
  try {
    const hierarchy = await Hierarchy.find({
      status: "Ativo",
      user: { $ne: null }
    })
      .select(
        "user funcional nome patente categoria funcao status dataEntrada dataUltimaPromocao cursos medalhas"
      )
      .lean();

    const lista = hierarchy
      .filter((item) => item.user)
      .map((item) => ({
        _id: item._id,
        user: item.user,
        funcional: item.funcional,
        nome: item.nome,
        patente: item.patente,
        categoria: item.categoria,
        funcao: item.funcao || "",
        status: item.status,
        dataEntrada: item.dataEntrada || null,
        dataUltimaPromocao: item.dataUltimaPromocao || null,
        cursos: item.cursos || [],
        medalhas: item.medalhas || []
      }))
      .sort((a, b) => {
        const ordemA = ORDEM_PATENTES[a.patente] || 999;
        const ordemB = ORDEM_PATENTES[b.patente] || 999;

        if (ordemA !== ordemB) return ordemA - ordemB;

        return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
      });

    return res.json(lista);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao carregar lista pública da hierarquia" });
  }
};