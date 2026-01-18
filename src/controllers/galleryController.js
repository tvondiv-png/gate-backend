const Gallery = require("../models/Gallery");
const fs = require("fs");
const path = require("path");

// Público
exports.listPublic = async (req, res) => {
  const items = await Gallery.find({ publicado: true }).sort({ createdAt: -1 });
  res.json(items);
};

// Admin
exports.listAdmin = async (req, res) => {
  const items = await Gallery.find().sort({ createdAt: -1 });
  res.json(items);
};

// Criar
exports.create = async (req, res) => {
  try {
    const { titulo, descricao, categoria, publicado } = req.body;

    if (!titulo) {
      return res.status(400).json({ message: "Título é obrigatório" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Imagem é obrigatória" });
    }

    const item = await Gallery.create({
      titulo,
      descricao,
      categoria,
      publicado: publicado === "true",
      imagem: req.file.filename,
      criadoPor: req.user.id
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar imagem" });
  }
};

// Editar (texto apenas)
exports.update = async (req, res) => {
  const { id } = req.params;
  const item = await Gallery.findByIdAndUpdate(id, req.body, { new: true });
  res.json(item);
};

// ❌ EXCLUIR (REMOVE DO ADMIN E DO PÚBLICO)
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Gallery.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Imagem não encontrada" });
    }

    // remover arquivo físico
    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "gallery",
      item.imagem
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Gallery.findByIdAndDelete(id);

    res.json({ message: "Imagem excluída com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir imagem" });
  }
};
