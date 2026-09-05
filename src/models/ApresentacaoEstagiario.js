const mongoose = require("mongoose");

const ApresentacaoEstagiarioSchema = new mongoose.Schema(
  {
    apresentadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    funcionalApresentador: {
      type: Number,
      required: true
    },

    nomeApresentador: {
      type: String,
      required: true
    },

    patenteApresentador: {
      type: String,
      required: true
    },

    policialApresentado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    funcionalEstagiario: {
      type: Number,
      required: true
    },

    nomeEstagiario: {
      type: String,
      required: true
    },

    patenteEstagiario: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Enviado", "Validado", "Rejeitado"],
      default: "Enviado"
    },

    observacao: {
      type: String,
      default: ""
    },

    comentarioAdmin: {
      type: String,
      default: ""
    },

    dataApresentacao: {
      type: Date,
      default: Date.now
    },

    validadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    nomeValidador: {
      type: String,
      default: null
    },

    dataValidacao: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ApresentacaoEstagiario",
  ApresentacaoEstagiarioSchema
);