const mongoose = require("mongoose");

const IndicationSchema = new mongoose.Schema(
  {
    idPersonagem: {
      type: String,
      required: true
    },

    nomePersonagem: {
      type: String,
      required: true
    },

    idadeReal: {
      type: Number,
      required: true
    },

    cnh: {
      type: String,
      enum: ["A", "B", "C", "D", "E"],
      required: true
    },

    discordId: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Pendente", "Aprovado", "Rejeitado"],
      default: "Pendente"
    },

    comentarioAdmin: {
      type: String
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Indication", IndicationSchema);
