const mongoose = require("mongoose");

/* =========================================================
   ROCAM STAGE

   Compatível com:
   - cadastro atual do Estagiário ROCAM;
   - metas configuráveis;
   - horas automáticas vindas do RSO ROCAM;
   - avaliações;
   - questionários;
   - aprovação com boletim;
   - histórico de progresso;
   - registros antigos que ainda possuam "member".
========================================================= */

const RocamStageSchema = new mongoose.Schema(
  {
    /* =====================================================
       LEGADO

       Mantido opcional para não quebrar registros antigos.
    ===================================================== */

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RocamMember",
      default: null,
      index: true
    },

    /* =====================================================
       PERFIL ROCAM
    ===================================================== */

    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RocamProfile",
      default: null,
      index: true
    },

    /* =====================================================
       USUÁRIO
    ===================================================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    funcional: {
      type: Number,
      default: null,
      index: true
    },

    /* =====================================================
       STATUS
    ===================================================== */

    status: {
      type: String,

      enum: [
        "EM_ANDAMENTO",
        "APTO_APROVACAO",
        "APROVACAO_SOLICITADA",
        "APROVADO",
        "REPROVADO",
        "CANCELADO",
        "DESLIGADO"
      ],

      default: "EM_ANDAMENTO",

      index: true
    },

    /* =====================================================
       DATAS
    ===================================================== */

    dataInicio: {
      type: Date,
      required: true,
      default: Date.now
    },

    dataConclusao: {
      type: Date,
      default: null
    },

    /* =====================================================
       METAS

       Mixed foi usado propositalmente.

       O sistema atual trabalha com:

       horasPatrulhamento: {
         habilitada: true,
         valor: 60
       }

       e também precisamos manter compatibilidade
       com registros antigos.
    ===================================================== */

    metas: {
      type: mongoose.Schema.Types.Mixed,

      default: () => ({
        horasPatrulhamento: {
          habilitada: true,
          valor: 60
        },

        quantidadePatrulhas: {
          habilitada: true,
          valor: 20
        },

        quantidadeAvaliacoes: {
          habilitada: true,
          valor: 10
        },

        mediaMinimaAvaliacoes: {
          habilitada: true,
          valor: 80
        },

        quantidadeQuestionarios: {
          habilitada: true,
          valor: 4
        },

        aproveitamentoQuestionarios: {
          habilitada: true,
          valor: 70
        },

        ausenciasInjustificadas: {
          habilitada: true,
          maximo: 0
        }
      })
    },

    /* =====================================================
       CRITÉRIOS DE AVALIAÇÃO

       Aceita:
       - String
       - objeto { codigo, label, obrigatorio }
    ===================================================== */

    criteriosAvaliacao: {
      type: [
        mongoose.Schema.Types.Mixed
      ],

      default: []
    },

    /* =====================================================
       QUESTIONÁRIOS
    ===================================================== */

    questionarios: {
      type: [
        mongoose.Schema.Types.Mixed
      ],

      default: []
    },

    /* =====================================================
       PROGRESSO

       Também usamos Mixed para permitir evolução
       do módulo sem alterar o schema a cada campo novo.
    ===================================================== */

    progresso: {
      type: mongoose.Schema.Types.Mixed,

      default: () => ({
        /* HORAS */

        horasCumpridas: 0,

        horasPatrulhamento: 0,

        horasPatrulhamentoMin: 0,

        /* PATRULHAS */

        patrulhasRealizadas: 0,

        quantidadePatrulhas: 0,

        /* AVALIAÇÕES */

        avaliacoesRealizadas: 0,

        quantidadeAvaliacoes: 0,

        mediaAvaliacoes: 0,

        /* QUESTIONÁRIOS */

        questionariosConcluidos: 0,

        quantidadeQuestionarios: 0,

        mediaQuestionarios: 0,

        /* AUSÊNCIAS */

        ausenciasInjustificadas: 0,

        /* PERCENTUAIS */

        percentualHoras: 0,

        percentualGeral: 0,

        /* ANTI-DUPLICIDADE */

        rsosRocamContabilizados: []
      })
    },

    /* =====================================================
       OBSERVAÇÕES
    ===================================================== */

    observacoes: {
      type: String,
      default: ""
    },

    observacaoConclusao: {
      type: String,
      default: ""
    },

    /* =====================================================
       RESPONSÁVEIS
    ===================================================== */

    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    solicitadoAprovacaoEm: {
      type: Date,
      default: null
    },

    aprovadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    /* =====================================================
       BOLETIM
    ===================================================== */

    boletimAprovacao: {
      type: String,
      default: ""
    }
  },

  {
    timestamps: true,

    /*
      Não remove objetos vazios.
      Útil para progresso/metas.
    */
    minimize: false
  }
);

/* =========================================================
   ÍNDICES
========================================================= */

RocamStageSchema.index({
  user: 1,
  status: 1
});

RocamStageSchema.index({
  profile: 1,
  status: 1
});

RocamStageSchema.index({
  funcional: 1,
  status: 1
});

/*
  Índice legado.
*/
RocamStageSchema.index({
  member: 1,
  status: 1
});

module.exports = mongoose.model(
  "RocamStage",
  RocamStageSchema
);