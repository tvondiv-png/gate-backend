const mongoose = require("mongoose");

const CienteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    funcional: {
      type: Number,
      required: true
    },
    nome: {
      type: String,
      default: ""
    },
    data: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const DestinatarioSchema = new mongoose.Schema(
  {
    funcional: {
      type: Number,
      required: true
    },
    nome: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const ComandoComunicadoSchema = new mongoose.Schema(
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

    prioridade: {
      type: String,
      enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
      default: "MEDIA"
    },

    destinoTipo: {
      type: String,
      enum: ["todos", "categoria", "funcionais"],
      default: "todos"
    },

    categoria: {
      type: String,
      default: ""
    },

    funcionais: {
      type: [Number],
      default: []
    },

    destinatarios: {
      type: [DestinatarioSchema],
      default: []
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    nomeCriador: {
      type: String,
      default: ""
    },

    ativo: {
      type: Boolean,
      default: true
    },

    exigeCiencia: {
      type: Boolean,
      default: true
    },

    cientes: {
      type: [CienteSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ComandoComunicado", ComandoComunicadoSchema);