const mongoose = require("mongoose");

const RegulationSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true
    },

    descricao: {
      type: String
    },

    conteudo: {
      type: String // texto direto (opcional)
    },

    arquivoPdf: {
      type: String // caminho do PDF (opcional)
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

module.exports = mongoose.model("Regulation", RegulationSchema);
