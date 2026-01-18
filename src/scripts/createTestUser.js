const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await User.findOne({ funcional: 100 });
    if (exists) {
      console.log("❌ Usuário de teste já existe.");
      process.exit(0);
    }

    const senhaHash = await bcrypt.hash("123456", 10);

    await User.create({
      funcional: 100,
      nome: "Usuário Teste",
      patente: "Soldado",
      email: "teste@gate.com",
      senha: senhaHash,
      role: "user",
      status: "Ativo"
    });

    console.log("✅ Usuário de teste criado com sucesso!");
    console.log("Login: teste@gate.com OU funcional 100");
    console.log("Senha: 123456");

    process.exit(0);
  } catch (err) {
    console.error("Erro ao criar usuário de teste:", err);
    process.exit(1);
  }
}

createTestUser();
