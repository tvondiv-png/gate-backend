const mongoose = require("mongoose");

const PatrolHoursSchema = new mongoose.Schema(
  {
    funcional: {
      type: Number,
      required: true,
      unique: true
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

    horasSemanaMin: {
      type: Number,
      default: 0
    },

    horasMesMin: {
      type: Number,
      default: 0
    },

    ausenciaPatrulhamento: {
      type: String,
      enum: ["normal", "justificada", "nao_justificada", "iniciante"],
      default: "normal"
    },

    observacaoAusencia: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatrolHours", PatrolHoursSchema);