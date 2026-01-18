const mongoose = require("mongoose");

const AbsenceSchema = new mongoose.Schema(
  {
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

    motivo: {
      type: String,
      required: true
    },

    dataInicio: {
      type: Date,
      required: true
    },

    dataFim: {
      type: Date,
      required: true
    },

    dias: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["Pendente", "Aprovada", "Rejeitada", "Encerrada"],
      default: "Pendente"
    },

    comentarioAdmin: {
      type: String
    },

    aprovadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Absence", AbsenceSchema);
