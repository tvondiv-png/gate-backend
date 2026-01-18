require("dotenv").config();
console.log("🚨 SERVER.JS CARREGADO");

const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB conectado com sucesso");

    app.listen(PORT, () => {
      console.log(`🚔 Servidor GATE rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Erro ao conectar no MongoDB", err);
  });
