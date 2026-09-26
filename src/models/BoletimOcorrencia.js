const mongoose = require("mongoose");

const IntegranteBoletimSchema = new mongoose.Schema(
  {
    funcional: { type: Number, default: null },
    nome: { type: String, required: true },
    patente: { type: String, default: "" },
    funcao: { type: String, default: "" }
  },
  { _id: false }
);

const ArtigoBoletimSchema = new mongoose.Schema(
  {
    codigo: { type: String, default: "" },
    artigo: { type: String, required: true },
    titulo: { type: String, required: true }
  },
  { _id: false }
);

const IlicitoBoletimSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["Armas", "Munições", "Entorpecentes", "Ilicitos", "Valores"],
      required: true
    },
    subtipo: { type: String, default: "" },
    serial: { type: String, default: "" },
    quantidade: { type: String, default: "" },
    descricao: { type: String, default: "" }
  },
  { _id: false }
);

const LocalBoletimSchema = new mongoose.Schema(
  {
    rua: { type: String, required: true },
    bairro: { type: String, required: true },
    cia: { type: String, default: "" }
  },
  { _id: false }
);

const BoletimOcorrenciaSchema = new mongoose.Schema(
  {
    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    funcionalCriador: { type: Number, default: null },
    nomeCriador: { type: String, default: "" },
    patenteCriador: { type: String, default: "" },

    rso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RSO",
      default: null
    },

    viatura: { type: String, required: true },

    equipe: {
      type: [IntegranteBoletimSchema],
      default: []
    },

    naturezaFatos: {
      type: [ArtigoBoletimSchema],
      default: []
    },

    localAbordagem: {
      type: LocalBoletimSchema,
      required: true
    },

    localFinalizacao: {
      type: LocalBoletimSchema,
      default: null
    },

    abordagem: {
      tipo: {
        type: String,
        enum: [
          "FUNDADA_SUSPEITA",
          "FLAGRANTE",
          "DENUNCIA",
          "ABORDAGEM_PADRAO"
        ],
        required: true
      },
      ordemDadaPor: { type: String, required: true },
      procedimentos: { type: [String], default: [] },
      resultado: {
        type: String,
        enum: [
          "PRESO",
          "LIBERADO",
          "CONDUZIDO_DELEGACIA",
          "HOSPITAL_PRESO",
          "HOSPITAL_LIBERADO",
          "OBITO_IML"
        ],
        required: true
      }
    },

    suspeito: {
      nome: { type: String, default: "Não identificado" },
      rg: { type: String, default: "" },
      vestimenta: { type: String, default: "" },
      corPele: { type: String, default: "" },
      cabelo: { type: String, default: "" }
    },

    veiculoSuspeito: {
      possui: { type: Boolean, default: false },
      marca: { type: String, default: "" },
      modelo: { type: String, default: "" },
      cor: { type: String, default: "" },
      placa: { type: String, default: "" }
    },

    ilicitos: {
      type: [IlicitoBoletimSchema],
      default: []
    },

    relatoTexto: { type: String, default: "" },
    textoCompleto: { type: String, default: "" }
  },
  { timestamps: true }
);

BoletimOcorrenciaSchema.index({ criadoPor: 1, createdAt: -1 });

module.exports = mongoose.model(
  "BoletimOcorrencia",
  BoletimOcorrenciaSchema
);
