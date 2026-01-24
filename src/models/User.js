const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    funcional: {
      type: Number,
      required: true,
      unique: true
    },

    nome: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    senha: {
      type: String,
      required: true
    },

    senhaPadrao: {
      type: Boolean,
      default: true
    },

    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user"
    },

    // ===== HIERARQUIA =====
    categoriaHierarquia: {
      type: String,
      enum: [
        "OFICIAIS_SUPERIORES",
        "OFICIAIS_INTERMEDIARIOS",
        "OFICIAIS_SUBALTERNOS",
        "PRACAS_ESPECIAIS",
        "PRACAS_GRADUADAS",
        "PRACAS",
        "ESTAGIARIOS"
      ],
      set: v =>
        v
          ?.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
    },

    patente: {
      type: String
    },

    funcao: {
      type: String
    },

    status: {
      type: String,
      enum: ["Ativo", "Ausente", "Afastado"],
      default: "Ativo"
    },

    dataEntrada: {
      type: Date
    },

    dataUltimaPromocao: {
      type: Date
    },

    cursos: [
      {
        type: String
      }
    ],

    ativo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
