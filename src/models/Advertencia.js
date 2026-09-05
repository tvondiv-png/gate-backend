const mongoose = require("mongoose");

const AdvertenciaSchema = new mongoose.Schema(
  {
    policial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    funcional: {
      type: Number,
      required: true
    },

    nome: {
      type: String,
      required: true
    },

    patente: {
      type: String,
      required: true
    },

    tipo: {
      type: String,
      enum: ["ADV 1", "ADV 2", "ADV 3"],
      required: true
    },

    semanaReferencia: {
      type: String,
      required: true
    },

    motivo: {
      type: String,
      default: "Não cumprimento da carga mínima semanal de patrulhamento operacional."
    },

    ativa: {
      type: Boolean,
      default: true
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advertencia", AdvertenciaSchema);