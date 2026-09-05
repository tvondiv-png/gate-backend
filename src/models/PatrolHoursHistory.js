const mongoose = require("mongoose");

const PatrolHoursHistorySchema = new mongoose.Schema(
  {
    funcional: {
      type: Number,
      required: true,
      index: true
    },

    nome: {
      type: String,
      required: true
    },

    patente: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Ativo", "Ausente", "Afastado"],
      default: "Ativo"
    },

    ausenciaPatrulhamento: {
      type: String,
      enum: ["normal", "justificada", "nao_justificada", "iniciante"],
      default: "normal"
    },

    observacaoAusencia: {
      type: String,
      default: ""
    },

    horasSemanaMin: {
      type: Number,
      default: 0
    },

    horasMesMin: {
      type: Number,
      default: 0
    },

    tipoRegistro: {
      type: String,
      enum: ["reset_week", "reset_month"],
      required: true
    },

    periodoInicio: {
      type: Date,
      default: null
    },

    periodoFim: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatrolHoursHistory", PatrolHoursHistorySchema);