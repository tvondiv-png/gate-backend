const mongoose = require("mongoose");

const RocamEvaluationSchema = new mongoose.Schema(
  {
    /* =====================================================
       ESTAGIÁRIO
    ===================================================== */

    traineeUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    traineeProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RocamProfile",
      required: true
    },

    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RocamStage",
      required: true,
      index: true
    },

    funcionalEstagiario: {
      type: Number,
      required: true
    },

    nomeEstagiario: {
      type: String,
      required: true
    },

    patenteEstagiario: {
      type: String,
      default: ""
    },

    /* =====================================================
       AVALIADOR
    ===================================================== */

    evaluatorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    evaluatorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RocamProfile",
      default: null
    },

    funcionalAvaliador: {
      type: Number,
      required: true
    },

    nomeAvaliador: {
      type: String,
      required: true
    },

    /* =====================================================
       CRITÉRIOS
    ===================================================== */

    criterios: [
      {
        codigo: {
          type: String,
          required: true
        },

        label: {
          type: String,
          required: true
        },

        resposta: {
          type: String,
          enum: [
            "ATENDE",
            "NAO_ATENDE"
          ],
          required: true
        },

        comentario: {
          type: String,
          default: ""
        }
      }
    ],

    /* =====================================================
       RESULTADO
    ===================================================== */

    totalCriterios: {
      type: Number,
      default: 0
    },

    totalAtende: {
      type: Number,
      default: 0
    },

    totalNaoAtende: {
      type: Number,
      default: 0
    },

    notaPercentual: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    comentarioBracal: {
      type: String,
      default: ""
    },

    /* =====================================================
       ANÁLISE DO COMANDO
    ===================================================== */

    status: {
      type: String,
      enum: [
        "PENDENTE_COMANDO",
        "VALIDADA",
        "DEVOLVIDA"
      ],
      default: "PENDENTE_COMANDO",
      index: true
    },

    comentarioComando: {
      type: String,
      default: ""
    },

    analisadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    analisadaEm: {
      type: Date,
      default: null
    },

    /* =====================================================
       DATA
    ===================================================== */

    dataAvaliacao: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

RocamEvaluationSchema.index({
  traineeUser: 1,
  dataAvaliacao: -1
});

RocamEvaluationSchema.index({
  evaluatorUser: 1,
  dataAvaliacao: -1
});

module.exports = mongoose.model(
  "RocamEvaluation",
  RocamEvaluationSchema
);