require("dotenv").config(); // 👈 ADICIONE ISSO

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");


async function createPolice() {
  await mongoose.connect(process.env.MONGO_URI);

  const senhaHash = await bcrypt.hash("123456", 10);

  const exists = await User.findOne({ funcional: 100 });
  if (exists) {
    console.log("❌ Policial teste já existe");
    process.exit();
  }

  const police = await User.create({
    funcional: 100,
    nome: "Policial Teste GATE",
    email: "policialteste@gate.com",
    senha: senhaHash,
    role: "user",

    // HIERARQUIA
    categoriaHierarquia: "ESTAGIARIOS",
    patente: "Soldado 2ª Classe PM",
    funcao: "Em formação",
    status: "Ativo",
    dataEntrada: new Date(),
    cursos: []
  });

  console.log("✅ Policial teste criado com sucesso!");
  console.log("Login: funcional 100");
  console.log("Senha: 123456");

  process.exit();
}

createPolice();
