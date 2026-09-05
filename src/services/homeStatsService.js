const HomeStats = require("../models/HomeStats");
const PatrolHours = require("../models/PatrolHours");

const getStats = async () => {
  let stats = await HomeStats.findOne();
  if (!stats) {
    stats = await HomeStats.create({});
  }
  return stats;
};

exports.somarApreensoes = async (apreensoes) => {
  const stats = await getStats();

  apreensoes.forEach(a => {
    if (stats.apreensoes[a.tipo] !== undefined) {
      stats.apreensoes[a.tipo] += a.quantidade;
    }
  });

  await stats.save();
};

exports.calcularPolicialDestaque = async () => {
  const agora = new Date();
  const mes = agora.getMonth();
  const ano = agora.getFullYear();

  const ranking = await PatrolHours.find().sort({ horasMesMin: -1 });

  if (!ranking.length) return;

  const top = ranking[0];
  const stats = await getStats();

  stats.policialDestaque = {
    funcional: top.funcional,
    nome: top.nome,
    patente: top.patente,
    horasMensais: top.horasMesMin,
    mes,
    ano
  };

  await stats.save();
};