const mongoose = require("mongoose");

const RocamNoticeSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },

    mensagem: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000
    },

    prioridade: {
      type: String,
      enum: [
        "NORMAL",
        "IMPORTANTE",
        "URGENTE"
      ],
      default: "NORMAL"
    },

    publico: {
      type: [String],
      enum: [
        "TODOS",
        "COMANDO_ROCAM",
        "SUBCOMANDO_ROCAM",
        "BRACAL_ROCAM",
        "ESTAGIARIO_ROCAM"
      ],
      default: ["TODOS"]
    },

    ativo: {
      type: Boolean,
      default: true
    },

    publicadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    expiraEm: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RocamNotice",
  RocamNoticeSchema
);