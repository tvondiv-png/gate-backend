exports.calcularMinutos = (inicio, fim = new Date()) => {
  if (!inicio) return 0;
  const diff = Math.floor((fim - inicio) / 60000);
  return diff > 0 ? diff : 0;
};
