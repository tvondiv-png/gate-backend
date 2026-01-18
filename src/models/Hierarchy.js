const mongoose = require("mongoose");

const HierarchySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    funcional: {
      type: Number,
      required: true,
      unique: true
    },

    nome: {
      type: String,
      required: true
    },

    patente: {
      type: String,
      required: true
    },

    categoria: {
      type: String,
      required: true
    },

    funcao: {
      type: String,
      enum: [
        "Comando do Batalhão",
        "Subcomando do Batalhão",
        "Coordenador Geral",
        "Coordenador Operacional",
        "Coordenador Administrativo",
        "Recursos Humanos",
        "Setor Justiça e Disciplina",
        "Comunicação Social",
        "Operacional"
      ],
      default: "Operacional"
    },

    cursos: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: ["Ativo", "Ausente", "Afastado"],
      default: "Ativo"
    },

    medalhas: {
      type: [String],
      enum: [
        "Láurea do Mérito Pessoal – 5º Grau",
        "Láurea do Mérito Pessoal – 4º Grau",
        "Láurea do Mérito Pessoal – 3º Grau",
        "Láurea do Mérito Pessoal – 2º Grau",
        "Láurea do Mérito Pessoal – 1º Grau"
        ],
        default: []
    },

    dataEntrada: {
      type: Date,
      default: Date.now
    },

    ultimaPromocao: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hierarchy", HierarchySchema);
