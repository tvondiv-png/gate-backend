require("dotenv").config();
console.log("🚨 SERVER.JS CARREGADO");

// Rede de segurança: um erro não tratado num endpoint não pode
// derrubar o processo inteiro e tirar o site do ar para todo mundo.
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

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
