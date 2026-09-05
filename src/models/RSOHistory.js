const mongoose = require("mongoose");

const RSOHistorySchema = new mongoose.Schema(
  {
    rsoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RSO"
    },

    tipoPatrulhamento: {
      type: String,
      enum: [
        "VIATURA",
        "ROCAM"
      ],
      default: "VIATURA"
    },

    viatura: {
      type: String,
      default: ""
    },

    /*
     * NOVO MODELO
     */
    equipe: {
      type: Array,
      default: []
    },

    /*
     * MODELO ANTIGO
     * Mantido para histórico existente
     */
    equipeFixa: {
      type: Object,
      default: {}
    },

    equipeRotativa: {
      type: Object,
      default: {}
    },

    apreensoes: {
      type: Array,
      default: []
    },

    totalMinutos: {
      type: Number,
      default: 0
    },

    aprovadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    dataAprovacao: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RSOHistory",
  RSOHistorySchema
);