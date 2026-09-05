const mongoose = require("mongoose");

const HistoricoSchema = new mongoose.Schema(
  {
    acao: { type: String, required: true },
    autorNome: { type: String, default: "" },
    autorPatente: { type: String, default: "" },
    comentario: { type: String, default: "" },
    data: { type: Date, default: Date.now }
  },
  { _id: false }
);

const PessoaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    funcional: { type: Number, required: true },
    nome: { type: String, required: true, trim: true },
    patente: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const AvaliacaoEstagioSchema = new mongoose.Schema(
  {
    avaliador: {
      type: PessoaSchema,
      required: true
    },

    estagiario: {
      type: PessoaSchema,
      required: true
    },

    rsoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RSO",
      default: null
    },

    viatura: {
      type: String,
      default: ""
    },

    data: {
      type: String,
      required: true,
      trim: true
    },

    horarioInicial: {
      type: String,
      required: true,
      trim: true
    },

    horarioFinal: {
      type: String,
      required: true,
      trim: true
    },

    condutaPatrulha: {
      type: String,
      default: ""
    },

    postura: {
      type: String,
      default: ""
    },

    proatividade: {
      type: String,
      default: ""
    },

    pontosFortes: {
      type: String,
      default: ""
    },

    podeMelhorar: {
      type: String,
      default: ""
    },

    observacoes: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["Pendente", "Revisao", "Validado"],
      default: "Pendente",
      index: true
    },

    comentarioCoordenador: {
      type: String,
      default: ""
    },

    validadoPor: {
      type: PessoaSchema,
      default: null
    },

    dataValidacao: {
      type: Date,
      default: null
    },

    historico: {
      type: [HistoricoSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AvaliacaoEstagio", AvaliacaoEstagioSchema);