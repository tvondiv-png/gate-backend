const multer = require("multer");
const path = require("path");

// destino dos uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = `slide-${Date.now()}${ext}`;
    cb(null, nome);
  }
});

// filtro de arquivos (somente imagens)
const fileFilter = (req, file, cb) => {
  const tipos = ["image/jpeg", "image/png", "image/webp"];

  if (tipos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Arquivo inválido. Apenas imagens."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

module.exports = upload;