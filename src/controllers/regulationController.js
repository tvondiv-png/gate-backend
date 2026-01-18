const Regulation = require("../models/Regulation");

// 🔓 PÚBLICO – listar apenas publicados
exports.listPublic = async (req, res) => {
  const regs = await Regulation.find({ publicado: true })
    .sort({ createdAt: -1 });
  res.json(regs);
};

// 🔐 SUPERADMIN – listar todos
exports.listAdmin = async (req, res) => {
  const regs = await Regulation.find().sort({ createdAt: -1 });
  res.json(regs);
};

// 🔐 SUPERADMIN – criar
exports.create = async (req, res) => {
  const { titulo, descricao, conteudo, publicado } = req.body;

  const reg = await Regulation.create({
    titulo,
    descricao,
    conteudo,
    publicado,
    criadoPor: req.user.id
  });

  res.json(reg);
};

// 🔐 SUPERADMIN – editar
exports.update = async (req, res) => {
  const { id } = req.params;

  const reg = await Regulation.findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );

  res.json(reg);
};

// 🔐 SUPERADMIN – excluir
exports.remove = async (req, res) => {
  const { id } = req.params;
  await Regulation.findByIdAndDelete(id);
  res.json({ message: "Regulamento excluído" });
};
