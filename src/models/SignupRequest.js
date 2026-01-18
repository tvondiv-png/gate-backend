const mongoose = require("mongoose");

const SignupRequestSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true
    },
    funcional: {
      type: Number,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["Pendente", "Aprovado", "Rejeitado"],
      default: "Pendente"
    },
    comentario: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SignupRequest", SignupRequestSchema);
