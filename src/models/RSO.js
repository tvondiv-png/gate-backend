const mongoose = require("mongoose");

// ============================
// INTEGRANTE
// ============================
const IntegranteSchema = new mongoose.Schema(
  {
    funcional: {
      type: Number,
      required: true
    },

    nome: {
      type: String,
      required: true
    },

    patente: {
      type: String,
      required: true
    },

    cargo: {
      type: String,
      required: true
    },

    qualificacaoRocam: {
      type: String,
      enum: [
        "NENHUM",
        "ESTAGIARIO_ROCAM",
        "BRACAL_ROCAM"
      ],
      default: "NENHUM"
    },

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
      enum: [
        "Ativo",
        "Encerrado"
      ],
      default: "Ativo"
    }
  },
  {
    _id: false
  }
);

// ============================
// APREENSÃO
// ============================
const ApreensaoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: [
        "Armas",
        "Munições",
        "Entorpecentes",
        "Ilicitos",
        "Valores"
      ],
      required: true
    },

    quantidade: {
      type: Number,
      required: true
    }
  },
  {
    _id: false
  }
);

// ============================
// RSO
// ============================
const RSOSchema = new mongoose.Schema(
  {
    /* =====================================================
       NOVO MODELO
       Usado pelos novos RSOs do 2º BPChq Anchieta
    ===================================================== */

    tipoPatrulhamento: {
      type: String,
      enum: [
        "VIATURA",
        "ROCAM"
      ],
      default: "VIATURA"
    },

    viatura: {
      type: String,
      required: true
    },

    equipe: {
      type: [IntegranteSchema],
      default: []
    },

    /* =====================================================
       MODELO ANTIGO
       Mantido para compatibilidade com os RSOs existentes
    ===================================================== */

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

    /* =====================================================
       APREENSÕES
    ===================================================== */

    apreensoes: {
      type: [ApreensaoSchema],
      default: []
    },

    /* =====================================================
       OBSERVAÇÕES
    ===================================================== */

    observacoes: {
      type: String,
      default: ""
    },

    /* =====================================================
       STATUS
    ===================================================== */

    status: {
      type: String,
      enum: [
        "Ativo",
        "Pendente",
        "Aprovado",
        "Rejeitado"
      ],
      default: "Ativo"
    },

    comentarioADM: {
      type: String,
      default: ""
    },

    /* =====================================================
       RESPONSÁVEL PELA ABERTURA
    ===================================================== */

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* =====================================================
       CONTROLE DE HORAS
    ===================================================== */

    horasJaContabilizadas: {
      type: Boolean,
      default: false
    },

    dataContabilizacaoHoras: {
      type: Date,
      default: null
    },

    /* =====================================================
       ENCERRAMENTO MANUAL PELO ADM
    ===================================================== */

    encerradoManualmentePorADM: {
      type: Boolean,
      default: false
    },

    nomeADMEncerramento: {
      type: String,
      default: ""
    },

    dataEncerramentoADM: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RSO",
  RSOSchema
);