const mongoose = require("mongoose");

const historicoSchema = new mongoose.Schema(
  {
    acao: {
      type: String,
      enum: ["CRIADA", "APROVADA", "REJEITADA"],
      required: true
    },
    data: {
      type: Date,
      default: Date.now
    },
    autorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    autorNome: {
      type: String,
      default: ""
    },
    autorPatente: {
      type: String,
      default: ""
    },
    observacao: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const profileUpdateRequestSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: [
        "CURSO",
        "MEDALHA",
        "PROMOCAO",
        "ALTERACAO_NOME",
        "ALTERACAO_FUNCIONAL"
      ],
      required: true
    },

    status: {
      type: String,
      enum: ["PENDENTE", "APROVADA", "REJEITADA"],
      default: "PENDENTE"
    },

    solicitante: {
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
        required: true
      },
      patente: {
        type: String,
        default: ""
      }
    },

    dadosAtuais: {
      nome: { type: String, default: "" },
      funcional: { type: Number, default: 0 },
      patente: { type: String, default: "" },
      cursos: { type: [String], default: [] },
      medalhas: { type: [String], default: [] }
    },

    dadosSolicitados: {
      curso: { type: String, default: "" },
      medalha: { type: String, default: "" },
      novaPatente: { type: String, default: "" },
      novoNome: { type: String, default: "" },
      novaFuncional: { type: Number, default: null },

      dataReferencia: { type: Date, default: null },
      numeroBoletim: { type: String, default: "" },
      nomeInstrutor: { type: String, default: "" }
    },

    validadoPor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      nome: {
        type: String,
        default: ""
      },
      patente: {
        type: String,
        default: ""
      },
      role: {
        type: String,
        default: ""
      }
    },

    validadoEm: {
      type: Date,
      default: null
    },

    observacaoAdmin: {
      type: String,
      default: ""
    },

    historico: {
      type: [historicoSchema],
      default: []
    }
  },
  { timestamps: true }
);

profileUpdateRequestSchema.index({ status: 1, createdAt: -1 });
profileUpdateRequestSchema.index({ tipo: 1, createdAt: -1 });
profileUpdateRequestSchema.index({ "solicitante.userId": 1, createdAt: -1 });

module.exports = mongoose.model("ProfileUpdateRequest", profileUpdateRequestSchema);