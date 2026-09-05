const cron = require("node-cron");
const { gerarAlertasAutomaticos } = require("../services/comandoInteligencia");

cron.schedule("0 8 * * *", async () => {
  console.log("🚨 Rodando inteligência do comando...");
  await gerarAlertasAutomaticos();
});