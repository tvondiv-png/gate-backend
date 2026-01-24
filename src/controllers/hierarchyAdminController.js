const User = require("../models/User");
const logAction = require("../utils/logAction");

/* =======================
   NORMALIZA CATEGORIA
======================= */
const normalizarCategoria = (categoria) => {
  if (!categoria) return categoria;

  return categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");
};

// LISTAR TODOS OS POLICIAIS (ATIVOS)
exports.listPolice = async (req, res) => {
  const users = await User.find({ ativo: true }).sort({ funcional: 1 });
  res.json(users);
};

// ATUALIZAR HIERARQUIA DE UM POLICIAL
exports.updateHierarchy = async (req, res) => {
  const { id } = req.params;
  const {
    categoriaHierarquia,
    patente,
    funcao,
    status,
    dataEntrada,
    dataUltimaPromocao,
    cursos
  } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  // ⚠️ BLINDAGEM DO ENUM
  user.categoriaHierarquia = normalizarCategoria(categoriaHierarquia);
  user.patente = patente;
  user.funcao = funcao;
  user.status = status;
  user.dataEntrada = dataEntrada;
  user.dataUltimaPromocao = dataUltimaPromocao;
  user.cursos = cursos;

  await user.save();

  await logAction({
    action: "ATUALIZAÇÃO DE HIERARQUIA",
    performedBy: req.user.id,
    targetUser: user._id
  });

  res.json(user);
};
