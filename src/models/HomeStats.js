const mongoose = require("mongoose");

const HomeStatsSchema = new mongoose.Schema(
  {
    apreensoes: {
      Entorpecentes: { type: Number, default: 0 },
      Armamentos: { type: Number, default: 0 },
      Municoes: { type: Number, default: 0 },
      Valores: { type: Number, default: 0 },
      Ilicitos: { type: Number, default: 0 }
    },

    policialDestaque: {
      funcional: Number,
      nome: String,
      patente: String,
      horasMensais: Number,
      mes: Number,
      ano: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeStats", HomeStatsSchema);
