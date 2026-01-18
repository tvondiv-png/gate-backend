const mongoose = require("mongoose");

// ============================
// INTEGRANTE
// ============================
const IntegranteSchema = new mongoose.Schema(
  {
    funcional: { type: Number, required: true },
    nome: { type: String, required: true },
    patente: { type: String, required: true },
    cargo: { type: String, required: true },

    horaEntrada: {
      type: Date,
      default: Date.now
    },

    horaSaida: {
      type: Date,
      default: null
    },

    tempoMinutos: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["Ativo", "Encerrado"],
      default: "Ativo"
    }
  },
  { _id: false }
);

// ============================
// APREENSÃO
// ============================
const ApreensaoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["Armas", "Munições", "Entorpecentes", "Valores", "Ilícitos"],
      required: true
    },
    quantidade: { type: Number, required: true },
      },
  { _id: false }
);

// ============================
// RSO
// ============================
const RSOSchema = new mongoose.Schema(
  {
    viatura: { type: String, required: true },

    equipeFixa: {
      chefe: IntegranteSchema,
      auxiliar: IntegranteSchema
    },

    equipeRotativa: {
      motorista: [IntegranteSchema],
      terceiro: [IntegranteSchema],
      quarto: [IntegranteSchema],
      quinto: [IntegranteSchema]
    },

    apreensoes: {
      type: [ApreensaoSchema],
      default: []
    },

    observacoes: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["Ativo", "Pendente", "Aprovado", "Rejeitado"],
      default: "Ativo"
    },

    comentarioADM: {
      type: String,
      default: ""
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RSO", RSOSchema);
