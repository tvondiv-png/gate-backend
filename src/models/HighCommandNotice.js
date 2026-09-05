const mongoose = require("mongoose");

const HighCommandNoticeSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true
    },

    mensagem: {
      type: String,
      required: true,
      trim: true
    },

    tipoDestino: {
      type: String,
      enum: ["todos", "funcao", "patente", "funcionais"],
      default: "todos"
    },

    funcao: {
      type: String,
      default: ""
    },

    patente: {
      type: String,
      default: ""
    },

    funcionais: {
      type: [Number],
      default: []
    },

    criadoPor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      nome: {
        type: String,
        default: ""
      }
    },

    ativo: {
      type: Boolean,
      default: true
    },

    respostas: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        funcional: {
          type: Number,
          required: true
        },
        decisao: {
          type: String,
          enum: ["MANTER", "APAGAR"],
          required: true
        },
        dataResposta: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("HighCommandNotice", HighCommandNoticeSchema);