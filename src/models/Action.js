const mongoose = require("mongoose");

const participanteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    funcional: {
      type: String,
      required: true,
      trim: true
    },
    patente: {
      type: String,
      required: true,
      trim: true
    },
    nome: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const historicoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: [
        "CRIADA",
        "REJEITADA",
        "REENVIADA",
        "APROVADA",
        "EXCLUIDA_HISTORICO",
        "ALTERACAO_META"
      ],
      required: true
    },
    data: {
      type: Date,
      default: Date.now
    },
    autorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    autorNome: {
      type: String,
      trim: true
    },
    observacao: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const actionSchema = new mongoose.Schema(
  {
    tipoAcao: {
      type: String,
      required: true,
      trim: true
    },
    nomeTipoAcao: {
      type: String,
      required: true,
      trim: true
    },
    categoriaAcao: {
      type: String,
      required: true,
      trim: true
    },

    resultado: {
      type: String,
      enum: ["GANHA", "PERDIDA"],
      required: true
    },

    contabilizarMeta: {
      type: Boolean,
      default: true
    },

    numeroAcao: {
      type: String,
      required: true,
      trim: true
    },

    dataAcao: {
      type: Date,
      required: true
    },
    horaAcao: {
      type: String,
      trim: true,
      default: ""
    },

    observacoes: {
      type: String,
      trim: true,
      default: ""
    },

    registrante: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      funcional: {
        type: String,
        required: true,
        trim: true
      },
      patente: {
        type: String,
        required: true,
        trim: true
      },
      nome: {
        type: String,
        required: true,
        trim: true
      }
    },

    participantes: {
      type: [participanteSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "A ação precisa ter ao menos 1 participante"
      }
    },

    status: {
      type: String,
      enum: ["PENDENTE", "APROVADA", "REJEITADA", "REENVIADA", "EXCLUIDA_HISTORICO"],
      default: "PENDENTE"
    },

    motivoRejeicao: {
      type: String,
      trim: true,
      default: ""
    },
    observacaoAdmin: {
      type: String,
      trim: true,
      default: ""
    },

    analisadoPor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      nome: {
        type: String,
        trim: true,
        default: ""
      },
      role: {
        type: String,
        trim: true,
        default: ""
      }
    },

    aprovadoEm: {
      type: Date,
      default: null
    },
    rejeitadoEm: {
      type: Date,
      default: null
    },
    reenviadoEm: {
      type: Date,
      default: null
    },

    versaoEnvio: {
      type: Number,
      default: 1
    },

    historicoValidacao: {
      type: [historicoSchema],
      default: []
    },

    excluidoHistorico: {
      type: Boolean,
      default: false
    },
    excluidoPor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      nome: {
        type: String,
        trim: true,
        default: ""
      }
    },
    excluidoEm: {
      type: Date,
      default: null
    },
    motivoExclusao: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

actionSchema.index({ numeroAcao: 1 });
actionSchema.index({ status: 1 });
actionSchema.index({ dataAcao: -1 });
actionSchema.index({ contabilizarMeta: 1 });

module.exports = mongoose.model("Action", actionSchema);