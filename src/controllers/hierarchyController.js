const Hierarchy = require("../models/Hierarchy");
const User = require("../models/User");
const hierarchyRules = require("../utils/hierarchyRules");
const logAction = require("../utils/logAction");

/**
 * 👤 USUÁRIO – MINHA HIERARQUIA
 */
exports.getMinhaHierarquia = async (req, res) => {
  try {
    const hierarchy = await Hierarchy.findOne({
      funcional: req.user.funcional,
      status: "Ativo"
    });

    if (!hierarchy) {
      return res.status(404).json({ message: "Hierarquia não encontrada" });
    }

    res.json(hierarchy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar hierarquia" });
  }
};

/**
 * 🌐 PÚBLICO – HIERARQUIA
 * ⚠️ FORMATO NÃO MUDA
 */
exports.getHierarchyPublic = async (req, res) => {
  try {
    const hierarchy = await Hierarchy.find({ status: "Ativo" })
      .sort({ categoria: 1, patente: 1 });

    const agrupado = {};

    hierarchy.forEach(h => {
      if (!agrupado[h.categoria]) {
        agrupado[h.categoria] = {
          categoria: h.categoria,
          cor: h.cor,
          total: 0,
          membros: []
        };
      }

      agrupado[h.categoria].total++;
      agrupado[h.categoria].membros.push(h);
    });

    res.json(agrupado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro hierarquia pública" });
  }
};

/**
 * 🧑‍💼 ADM – LISTAR
 */
exports.getHierarchy = async (req, res) => {
  try {
    const hierarchy = await Hierarchy.find()
      .populate("user", "nome funcional")
      .sort({ categoria: 1, patente: 1 });

    res.json(hierarchy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar hierarquia" });
  }
};

/**
 * 🧑‍💼 ADM – ATUALIZAR
 */
exports.updateHierarchy = async (req, res) => {
  try {
    const { id } = req.params;

    const hierarchy = await Hierarchy.findById(id);
    if (!hierarchy) {
      return res.status(404).json({ message: "Hierarquia não encontrada" });
    }

    if (req.body.patente) {
      hierarchy.patente = req.body.patente;
      hierarchy.categoria =
        hierarchyRules.definirCategoriaPorPatente(req.body.patente);
    }

    if (req.body.funcao) hierarchy.funcao = req.body.funcao;
    if (req.body.status) hierarchy.status = req.body.status;
    if (Array.isArray(req.body.cursos)) hierarchy.cursos = req.body.cursos;
    if (Array.isArray(req.body.medalhas)) hierarchy.medalhas = req.body.medalhas;

    await hierarchy.save();

    // 🔥 SINCRONIZA USER
    await User.findOneAndUpdate(
      { funcional: hierarchy.funcional },
      {
        patente: hierarchy.patente,
        funcao: hierarchy.funcao,
        status: hierarchy.status,
        categoriaHierarquia: hierarchy.categoria,
        cursos: hierarchy.cursos
      }
    );

    await logAction({
      action: "HIERARQUIA ATUALIZADA",
      performedBy: req.user.id,
      targetUser: hierarchy.user
    });

    res.json(hierarchy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * 🧑‍💼 ADM – DELETAR
 */
exports.deleteHierarchy = async (req, res) => {
  try {
    const { id } = req.params;

    const hierarchy = await Hierarchy.findById(id);
    if (!hierarchy) {
      return res.status(404).json({ message: "Hierarquia não encontrada" });
    }

    await hierarchy.deleteOne();
    res.json({ message: "Registro removido da hierarquia" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao deletar hierarquia" });
  }
};
