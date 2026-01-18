const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    acao: {
      type: String,
      required: true
    },
    modulo: {
      type: String,
      required: true
    },
    alvoId: {
      type: String
    },
    detalhes: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", LogSchema);
