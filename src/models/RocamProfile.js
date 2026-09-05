const mongoose = require("mongoose");

const RocamProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    hierarchy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hierarchy",
      required: true
    },

    funcional: {
      type: Number,
      required: true,
      index: true
    },

    nome: {
      type: String,
      required: true
    },

    patente: {
      type: String,
      default: ""
    },

    papelRocam: {
      type: String,
      enum: [
        "COMANDO_ROCAM",
        "SUBCOMANDO_ROCAM",
        "BRACAL_ROCAM",
        "ESTAGIARIO_ROCAM"
      ],
      required: true
    },

    situacaoRocam: {
      type: String,
      enum: [
        "ATIVO",
        "EM_ESTAGIO",
        "AFASTADO",
        "SUSPENSO",
        "DESLIGADO"
      ],
      default: "ATIVO"
    },

    ativo: {
      type: Boolean,
      default: true,
      index: true
    },

    dataIngressoRocam: {
      type: Date,
      required: true,
      default: Date.now
    },

    dataSaidaRocam: {
      type: Date,
      default: null
    },

    motivoSaida: {
      type: String,
      default: ""
    },

    boletimSaida: {
      type: String,
      default: ""
    },

    cadastradoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    atualizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

RocamProfileSchema.index({
  ativo: 1,
  papelRocam: 1
});

module.exports = mongoose.model(
  "RocamProfile",
  RocamProfileSchema
);