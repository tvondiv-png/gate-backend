const mongoose = require("mongoose");

const RocamHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    funcional: {
      type: Number,
      required: true,
      index: true
    },

    evento: {
      type: String,
      enum: [
        "INGRESSO_ESTAGIO",
        "INGRESSO_COMANDO",
        "INGRESSO_SUBCOMANDO",
        "CONCESSAO_BRACAL",
        "APROVACAO_ESTAGIO",
        "SOLICITACAO_APROVACAO",
        "ALTERACAO_META",
        "AFASTAMENTO",
        "RETORNO",
        "SUSPENSAO",
        "RETIRADA_BRACAL",
        "DESLIGAMENTO_ROCAM",
        "ALTERACAO_FUNCAO_ROCAM"
      ],
      required: true
    },

    titulo: {
      type: String,
      required: true
    },

    descricao: {
      type: String,
      default: ""
    },

    papelAnterior: {
      type: String,
      default: ""
    },

    papelNovo: {
      type: String,
      default: ""
    },

    numeroBoletim: {
      type: String,
      default: ""
    },

    dataEvento: {
      type: Date,
      default: Date.now,
      index: true
    },

    responsavel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

RocamHistorySchema.index({
  funcional: 1,
  dataEvento: -1
});

module.exports = mongoose.model(
  "RocamHistory",
  RocamHistorySchema
);