const mongoose = require("mongoose");

const IPMSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      unique: true,
      required: true
    },

    ano: {
      type: Number,
      required: true
    },

    sequencial: {
      type: Number,
      required: true
    },

    policial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    policialSnapshot: {
      funcional: Number,
      nome: String,
      patente: String
    },

    status: {
      type: String,
      enum: ["Aberto", "Em Instrução", "Concluído"],
      default: "Aberto"
    },

    descricaoInicial: {
      type: String,
      required: true
    },

    comentariosInternos: [
      {
        autor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        texto: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    boletimConclusao: {
      conclusao: String,
      sancoes: String,
      data: Date
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("IPM", IPMSchema);
