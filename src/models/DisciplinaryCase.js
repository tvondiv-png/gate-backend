const mongoose = require("mongoose");

const DisciplinaryCaseSchema = new mongoose.Schema(
  {
    numero: { type: String, unique: true },
    ano: { type: Number },

    policial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    tipo: {
      type: String,
      enum: ["IPM", "Advertência", "Suspensão", "Investigação", "Outro"],
      required: true
    },

    descricao: {
      type: String,
      required: true
    },

    comentarios: [
      {
        texto: String,
        autor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    convocacoes: [
      {
        mensagem: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    conclusao: {
      texto: String,
      sancoes: String,
      data: Date
    },

    status: {
      type: String,
      enum: ["Aberto", "Em Análise", "Encerrado"],
      default: "Aberto"
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisciplinaryCase", DisciplinaryCaseSchema);
