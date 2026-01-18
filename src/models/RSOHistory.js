const mongoose = require("mongoose");

const RSOHistorySchema = new mongoose.Schema(
  {
    rsoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RSO"
    },

    viatura: String,

    equipeFixa: Object,
    equipeRotativa: Object,

    apreensoes: Array,

    totalMinutos: Number,

    aprovadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    dataAprovacao: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RSOHistory", RSOHistorySchema);
