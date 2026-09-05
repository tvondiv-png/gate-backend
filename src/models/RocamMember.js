const mongoose = require("mongoose");

const RocamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    papel: {
      type: String,
      enum: [
        "ESTAGIARIO_ROCAM",
        "BRACAL_ROCAM",
        "SUBCOMANDO_ROCAM",
        "COMANDO_ROCAM"
      ],
      required: true
    },

    ativo: {
      type: Boolean,
      default: true
    },

    dataEntrada: {
      type: Date,
      required: true,
      default: Date.now
    },

    dataSaida: {
      type: Date,
      default: null
    },

    motivoSaida: {
      type: String,
      default: ""
    },

    boletimIngresso: {
      type: String,
      default: ""
    },

    boletimSaida: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

/*
  Um policial pode possuir histórico ROCAM,
  mas somente um vínculo ATIVO por vez.
*/
RocamMemberSchema.index(
  { user: 1, ativo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ativo: true
    }
  }
);

module.exports = mongoose.model(
  "RocamMember",
  RocamMemberSchema
);