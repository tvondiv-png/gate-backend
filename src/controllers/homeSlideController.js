const HomeSlide = require("../models/HomeSlide");

/**
 * 🌐 PÚBLICO – SLIDES ATIVOS
 */
exports.listPublic = async (req, res) => {
  const slides = await HomeSlide.find({ ativo: true })
    .sort({ ordem: 1, createdAt: -1 });

  res.json(slides);
};

/**
 * 🧑‍💼 ADM – LISTAR TODOS
 */
exports.listAdmin = async (req, res) => {
  const slides = await HomeSlide.find().sort({
    ordem: 1,
    createdAt: -1
  });

  res.json(slides);
};

/**
 * 🧑‍💼 ADM – CRIAR SLIDE
 */
exports.create = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Imagem obrigatória" });
  }

  const slide = await HomeSlide.create({
    imagem: `/uploads/${req.file.filename}`,
    titulo: req.body.titulo || "",
    ordem: Number(req.body.ordem) || 0
  });

  res.json(slide);
};

/**
 * 🧑‍💼 ADM – EXCLUIR SLIDE
 */
exports.remove = async (req, res) => {
  await HomeSlide.findByIdAndDelete(req.params.id);
  res.json({ message: "Slide removido" });
};
