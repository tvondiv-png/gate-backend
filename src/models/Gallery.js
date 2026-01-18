const mongoose = require("mongoose");

const GallerySchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true
    },

    descricao: {
      type: String,
      default: ""
    },

    imagem: {
      type: String, // nome do arquivo salvo
      required: true
    },

    categoria: {
      type: String,
      default: "Geral"
    },

    publicado: {
      type: Boolean,
      default: false
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", GallerySchema);
