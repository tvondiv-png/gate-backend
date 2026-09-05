const mongoose = require("mongoose");

const RocamMessageSchema = new mongoose.Schema(
  {
    remetente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    destinatario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    assunto: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    mensagem: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },

    lida: {
      type: Boolean,
      default: false
    },

    lidaEm: {
      type: Date,
      default: null
    },

    apagadaRemetente: {
      type: Boolean,
      default: false
    },

    apagadaDestinatario: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

RocamMessageSchema.index({
  destinatario: 1,
  createdAt: -1
});

RocamMessageSchema.index({
  remetente: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  "RocamMessage",
  RocamMessageSchema
);