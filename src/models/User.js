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

    // 🔥 NOVO ROLE
    role: {
      type: String,
      enum: ["user", "admin", "comando", "superadmin"],
      default: "user"
    },

    resetAcoesPorPromocao: {
  type: Boolean,
  default: false
},

dataResetAcoesPorPromocao: {
  type: Date,
  default: null
},

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

    patente: String,
    funcao: String,

    status: {
      type: String,
      enum: ["Ativo", "Ausente", "Afastado"],
      default: "Ativo"
    },

    dataEntrada: {
  type: Date,
  default: null
},

dataUltimaPromocao: {
  type: Date,
  default: null
},

medalhas: {
  type: [String],
  default: []
},

    cursos: [String],

    ativo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);