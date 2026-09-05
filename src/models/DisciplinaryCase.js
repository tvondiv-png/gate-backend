const mongoose = require("mongoose");

const comentarioSchema = new mongoose.Schema(
  {
    texto: {
      type: String,
      required: true,
      trim: true
    },
    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    origem: {
      type: String,
      enum: ["SJD", "POLICIAL", "SISTEMA"],
      default: "SJD"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const convocacaoSchema = new mongoose.Schema(
  {
    mensagem: {
      type: String,
      required: true,
      trim: true
    },
    dataAudiencia: {
      type: Date,
      default: null
    },
    local: {
      type: String,
      trim: true,
      default: ""
    },
    obrigatoria: {
      type: Boolean,
      default: true
    },
    ciente: {
      type: Boolean,
      default: false
    },
    compareceu: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const manifestacaoSchema = new mongoose.Schema(
  {
    texto: {
      type: String,
      required: true,
      trim: true
    },
    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tipo: {
      type: String,
      enum: ["DEFESA", "ESCLARECIMENTO", "PARECER", "RESPOSTA"],
      default: "RESPOSTA"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const artigoPenalSchema = new mongoose.Schema(
  {
    codigo: { type: String, trim: true, required: true },
    artigo: { type: String, trim: true, required: true },
    titulo: { type: String, trim: true, required: true },
    multa: { type: Number, default: 0 },
    prisaoMeses: { type: Number, default: 0 },
    semFianca: { type: Boolean, default: false }
  },
  { _id: false }
);

const artigoDisciplinarSchema = new mongoose.Schema(
  {
    codigo: { type: String, trim: true, required: true },
    secao: { type: String, trim: true, default: "" },
    item: { type: String, trim: true, default: "" },
    titulo: { type: String, trim: true, required: true },
    gravidade: {
      type: String,
      enum: ["LEVE", "MEDIA", "GRAVE", "GRAVISSIMA"],
      default: "MEDIA"
    }
  },
  { _id: false }
);

const historicoSchema = new mongoose.Schema(
  {
    acao: {
      type: String,
      required: true,
      trim: true
    },
    descricao: {
      type: String,
      trim: true,
      default: ""
    },
    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    origem: {
      type: String,
      enum: ["SJD", "POLICIAL", "SISTEMA"],
      default: "SISTEMA"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const sancaoFinalSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: [
        "ARQUIVAMENTO",
        "ORIENTACAO_VERBAL",
        "ADVERTENCIA",
        "SUSPENSAO",
        "EXONERACAO",
        "ENCAMINHAMENTO_PENAL",
        "PAD_1_3",
        "PAD_2_3",
        "PAD_3_3",
        "OUTRA"
      ],
      default: "OUTRA"
    },
    padNivel: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 0
    },
    descricao: {
      type: String,
      trim: true,
      default: ""
    },
    dataAplicacao: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const DisciplinaryCaseSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      unique: true,
      trim: true
    },

    ano: {
      type: Number
    },

    policial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    tipo: {
      type: String,
      enum: ["IPM", "PAD", "Advertência", "Suspensão", "Investigação", "Outro"],
      required: true
    },

    descricao: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        "ABERTO",
        "AGUARDANDO_CIENCIA",
        "AGUARDANDO_MANIFESTACAO",
        "EM_ANALISE",
        "CONVOCADO",
        "CONCLUIDO",
        "ARQUIVADO",
        "SANCAO_APLICADA"
      ],
      default: "ABERTO",
      index: true
    },

    prioridade: {
      type: String,
      enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
      default: "MEDIA"
    },

    cienciaPolicial: {
      confirmada: {
        type: Boolean,
        default: false
      },
      data: {
        type: Date,
        default: null
      }
    },

    prazoResposta: {
      type: Date,
      default: null
    },

    comentarios: {
      type: [comentarioSchema],
      default: []
    },

    convocacoes: {
      type: [convocacaoSchema],
      default: []
    },

    manifestacoes: {
      type: [manifestacaoSchema],
      default: []
    },

    artigosPenais: {
      type: [artigoPenalSchema],
      default: []
    },

    artigosDisciplinares: {
      type: [artigoDisciplinarSchema],
      default: []
    },

    atenuantes: {
      type: [String],
      default: []
    },

    agravantes: {
      type: [String],
      default: []
    },

    conclusao: {
      texto: {
        type: String,
        trim: true,
        default: ""
      },
      data: {
        type: Date,
        default: null
      }
    },

    sancaoFinal: {
      type: sancaoFinalSchema,
      default: () => ({})
    },

    historico: {
      type: [historicoSchema],
      default: []
    },

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisciplinaryCase", DisciplinaryCaseSchema);