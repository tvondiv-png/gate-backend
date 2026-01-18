exports.calcularHoras = (entrada, saida) => {
  if (!entrada || !saida) return 0;
  const diff = new Date(saida) - new Date(entrada);
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
};
