const mongoose = require("mongoose");

/* =========================================================
   META DO COMANDO

   O Comando/Subcomando do Batalhão estabelece metas de
   HORAS de patrulhamento ou de AÇÕES aprovadas, para TODOS
   ou por categoria da hierarquia, num período semanal ou
   mensal. O progresso é calculado on-the-fly a partir de
   PatrolHours (horas) ou Action (ações aprovadas).

   Ao vencer o prazo, a meta fica "expirada" e só é removida
   com ação explícita do Comando.
========================================================= */

const CATEGORIAS_HIERARQUIA = [
  "OFICIAIS_SUPERIORES",
  "OFICIAIS_INTERMEDIARIOS",
  "OFICIAIS_SUBALTERNOS",
  "PRACAS_ESPECIAIS",
  "PRACAS_GRADUADAS",
  "PRACAS",
  "ESTAGIARIOS"
];

const ComandoMetaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },

    descricao: {
      type: String,
      default: "",
      maxlength: 2000
    },

    tipo: {
      type: String,
      enum: ["HORAS", "ACOES"],
      required: true
    },

    periodo: {
      type: String,
      enum: ["SEMANAL", "MENSAL"],
      required: true
    },

    valorAlvo: {
      type: Number,
      required: true,
      min: 1
    },

    alvo: {
      type: String,
      enum: ["TODOS", "CATEGORIAS"],
      default: "TODOS"
    },

    categorias: {
      type: [String],
      enum: CATEGORIAS_HIERARQUIA,
      default: []
    },

    dataInicio: {
      type: Date,
      required: true
    },

    dataFim: {
      type: Date,
      required: true,
      index: true
    },

    ativa: {
      type: Boolean,
      default: true,
      index: true
    },

    expirada: {
      type: Boolean,
      default: false
    },

    criadaPor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      nome: { type: String, default: "" }
    },

    // usuários que já visualizaram o alerta desta meta
    vistoPor: {
      type: [mongoose.Schema.Types.ObjectId],
      default: []
    }
  },
  { timestamps: true }
);

ComandoMetaSchema.statics.CATEGORIAS = CATEGORIAS_HIERARQUIA;

module.exports = mongoose.model("ComandoMeta", ComandoMetaSchema);
