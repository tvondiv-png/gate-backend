require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

async function resetarSenha() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado");

    const funcional = 713; // 🔴 MUDE SE NECESSÁRIO
    const novaSenha = "123456";

    const user = await User.findOne({ funcional });

    if (!user) {
      console.log("❌ Usuário não encontrado");
      process.exit(1);
    }

    const hash = await bcrypt.hash(novaSenha, 10);

    user.senha = hash;
    user.senhaPadrao = true;
    await user.save();

    console.log("✅ SENHA RESETADA COM SUCESSO");
    console.log("Funcional:", user.funcional);
    console.log("Email:", user.email);
    console.log("Senha:", novaSenha);

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err);
    process.exit(1);
  }
}

resetarSenha();
