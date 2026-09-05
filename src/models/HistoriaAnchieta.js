const mongoose = require("mongoose");

/* =========================================================
   HISTÓRIA DO ANCHIETA

   Documento institucional único (singleton). A página
   pública mostra; admin e superadmin editam.
========================================================= */

const SecaoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    corpo: {
      type: String,
      default: "",
      maxlength: 20000
    }
  },
  { _id: true }
);

const HistoriaAnchietaSchema = new mongoose.Schema(
  {
    // chave fixa para garantir documento único
    chave: {
      type: String,
      default: "PRINCIPAL",
      unique: true,
      immutable: true
    },

    titulo: {
      type: String,
      default: "História do 2º BPChq - Anchieta",
      trim: true,
      maxlength: 200
    },

    resumo: {
      type: String,
      default: "",
      maxlength: 4000
    },

    secoes: {
      type: [SecaoSchema],
      default: []
    },

    atualizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "HistoriaAnchieta",
  HistoriaAnchietaSchema
);
