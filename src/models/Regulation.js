const mongoose = require("mongoose");

const RegulationSchema =
  new mongoose.Schema(
    {
      titulo: {
        type: String,
        required: true,
        trim: true
      },

      descricao: {
        type: String,
        default: ""
      },

      conteudo: {
        type: String,
        default: ""
      },

      arquivoPdf: {
        type: String,
        default: ""
      },

      categoria: {
        type: String,
        enum: [
          "GERAL",
          "ROCAM"
        ],
        default: "GERAL"
      },

      publicado: {
        type: Boolean,
        default: false
      },

      criadoPor: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "Regulation",
    RegulationSchema
  );