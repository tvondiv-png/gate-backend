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
    quantidade: { type: String, default: "" },
    descricao: { type: String, default: "" }
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

    local: {
      rua: { type: String, required: true },
      bairro: { type: String, required: true },
      cidade: { type: String, default: "Anchieta" },
      referencia: { type: String, default: "" }
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
          "ENCAMINHADO_HOSPITAL"
        ],
        required: true
      }
    },

    suspeito: {
      nome: { type: String, default: "Não identificado" },
      vestimenta: { type: String, default: "" },
      corPele: { type: String, default: "" },
      cabelo: { type: String, default: "" },
      barba: { type: String, default: "" },
      altura: { type: String, default: "" },
      porteFisico: { type: String, default: "" }
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
