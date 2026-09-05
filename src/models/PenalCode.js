const mongoose = require("mongoose");

const PenalCodeHistorySchema = new mongoose.Schema(
  {
    acao: {
      type: String,
      default: ""
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
    },
    data: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const penalCodeSchema = new mongoose.Schema(
  {
    artigo: {
      type: String,
      required: true,
      trim: true
    },

    codigo: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    titulo: {
      type: String,
      required: true,
      trim: true
    },

    tipo: {
      type: String,
      enum: ["INFRACAO", "CRIME"],
      required: true,
      index: true
    },

    categoria: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    descricao: {
      type: String,
      required: true,
      trim: true
    },

    multa: {
      type: Number,
      default: 0
    },

    prisaoMeses: {
      type: Number,
      default: 0
    },

    semFianca: {
      type: Boolean,
      default: false,
      index: true
    },

    palavrasChave: {
      type: [String],
      default: []
    },

    observacoes: {
      type: [String],
      default: []
    },

    ativo: {
      type: Boolean,
      default: true,
      index: true
    },

    destaque: {
      type: Boolean,
      default: false,
      index: true
    },

    ordem: {
      type: Number,
      default: 0
    },

    atualizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    ultimaAtualizacaoDescricao: {
      type: String,
      default: ""
    },

    historico: {
      type: [PenalCodeHistorySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

penalCodeSchema.index({ codigo: 1, ativo: 1 });
penalCodeSchema.index({ destaque: 1, ativo: 1, ordem: 1 });
penalCodeSchema.index({
  titulo: "text",
  descricao: "text",
  palavrasChave: "text",
  categoria: "text",
  artigo: "text",
  codigo: "text"
});

module.exports = mongoose.model("PenalCode", penalCodeSchema);