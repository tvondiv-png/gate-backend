const IPM = require("../models/IPM");

module.exports = async function generateIPMNumber() {
  const ano = new Date().getFullYear();

  const last = await IPM.findOne({ ano }).sort({ sequencial: -1 });

  const sequencial = last ? last.sequencial + 1 : 1;

  const numero = `IPM-${String(sequencial).padStart(4, "0")}/${ano}`;

  return { numero, ano, sequencial };
};
