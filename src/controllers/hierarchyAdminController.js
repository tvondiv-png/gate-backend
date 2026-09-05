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

/* =======================
   CONVERTE DATA YYYY-MM-DD
   PARA UTC FIXO SEM PERDER DIA
======================= */
const parseDateOnly = (valor) => {
  if (!valor) return null;

  const [ano, mes, dia] = String(valor).split("-").map(Number);

  if (!ano || !mes || !dia) return null;

  return new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
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
    nome,
    funcional,
    categoriaHierarquia,
    patente,
    funcao,
    status,
    dataEntrada,
    dataUltimaPromocao,
    cursos,
    medalhas
  } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const dataPromocaoAnterior = user.dataUltimaPromocao
    ? user.dataUltimaPromocao.toISOString().slice(0, 10)
    : null;

  const novaDataPromocao = dataUltimaPromocao || null;

  user.nome = nome;
  user.funcional = funcional;
  user.categoriaHierarquia = normalizarCategoria(categoriaHierarquia);
  user.patente = patente;
  user.funcao = funcao;
  user.status = status;
  user.dataEntrada = parseDateOnly(dataEntrada);
  user.dataUltimaPromocao = parseDateOnly(dataUltimaPromocao);
  user.cursos = Array.isArray(cursos) ? cursos : [];
  user.medalhas = Array.isArray(medalhas) ? medalhas : [];

  if (novaDataPromocao && novaDataPromocao !== dataPromocaoAnterior) {
    user.resetAcoesPorPromocao = true;
    user.dataResetAcoesPorPromocao = new Date();
  }

  await user.save();

  await logAction({
    action: "ATUALIZAÇÃO DE HIERARQUIA",
    performedBy: req.user.id,
    targetUser: user._id
  });

  res.json(user);
};