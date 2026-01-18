const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await User.findOne({ role: "superadmin" });

    if (exists) {
      console.log("❌ Já existe um SuperAdmin no sistema.");
      process.exit(0);
    }

    const senhaHash = await bcrypt.hash("123456", 10);

    await User.create({
      funcional: 1,
      nome: "Super Admin GATE",
      patente: "SuperAdmin",
      email: "superadmin@gate.com",
      senha: senhaHash,
      role: "superadmin",
      status: "Ativo"
    });

    console.log("✅ SuperAdmin criado com sucesso!");
    console.log("Login: superadmin@gate.com OU funcional 1");
    console.log("Senha: 123456");

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao criar SuperAdmin:", err);
    process.exit(1);
  }
}

createSuperAdmin();
