require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

async function resetarSenha() {
  await mongoose.connect(process.env.MONGO_URI);

  const novaSenha = "123456";
  const hash = await bcrypt.hash(novaSenha, 10);

  const user = await User.findOne({ email: "superadmin@gate.com" });

  if (!user) {
    console.log("❌ Usuário não encontrado");
    process.exit();
  }

  user.senha = hash;
  user.senhaPadrao = false;
  await user.save();

  console.log("✅ Senha redefinida com sucesso");
  console.log("📧 Email:", user.email);
  console.log("🔑 Senha:", novaSenha);

  process.exit();
}

resetarSenha();
