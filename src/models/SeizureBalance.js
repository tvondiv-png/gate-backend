const mongoose = require("mongoose");

const SeizureBalanceSchema = new mongoose.Schema(
  {
    ano: {
      type: Number,
      required: true
    },

    mes: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    armas: {
      type: Number,
      default: 0
    },

    municoes: {
      type: Number,
      default: 0
    },

    entorpecentes: {
      type: Number,
      default: 0
    },

    ilicitos: {
      type: Number,
      default: 0
    },

    valores: {
      type: Number,
      default: 0
    },

    fechadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

SeizureBalanceSchema.index(
  { ano: 1, mes: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "SeizureBalance",
  SeizureBalanceSchema
);