const mongoose = require("mongoose");

/* =========================================================
   CONQUISTA (gamificação)

   Registro permanente de uma conquista de um policial —
   meta do Comando atingida, sequência de semanas cumprindo
   a meta mínima de patrulhamento, etc. Alimenta o Quadro de
   Honra público e "Minhas conquistas" no painel do usuário.

   `chave` garante que a mesma conquista não é registrada
   duas vezes (ex.: "meta:<id>", "sequencia:8").
========================================================= */

const ConquistaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    funcional: Number,
    nome: String,
    patente: String,

    tipo: {
      type: String,
      enum: ["META_ATINGIDA", "SEQUENCIA_SEMANAS"],
      required: true
    },

    titulo: {
      type: String,
      required: true
    },

    descricao: {
      type: String,
      default: ""
    },

    chave: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

ConquistaSchema.index({ user: 1, chave: 1 }, { unique: true });

module.exports = mongoose.model("Conquista", ConquistaSchema);
