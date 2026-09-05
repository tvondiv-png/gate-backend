const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    titulo: {
      type: String,
      required: true,
      trim: true
    },

    mensagem: {
      type: String,
      required: true,
      trim: true
    },

    tipo: {
      type: String,
      enum: [
        "GERAL",
        "DISCIPLINA_ABERTURA",
        "DISCIPLINA_COMENTARIO",
        "DISCIPLINA_CONVOCACAO",
        "DISCIPLINA_MANIFESTACAO",
        "DISCIPLINA_CONCLUSAO",
        "DISCIPLINA_SANCAO",
        "DISCIPLINA_PAD"
      ],
      default: "GERAL",
      index: true
    },

    referenciaId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    referenciaModelo: {
      type: String,
      default: ""
    },

    lida: {
      type: Boolean,
      default: false
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);