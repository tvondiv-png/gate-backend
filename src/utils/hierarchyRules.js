exports.definirCategoriaPorPatente = (patente) => {
  if (!patente) return "ESTAGIARIOS";

  if (
    patente.includes("Coronel") ||
    patente.includes("Tenente-Coronel") ||
    patente.includes("Major")
  ) {
    return "OFICIAIS_SUPERIORES";
  }

  if (patente.includes("Capitão")) {
    return "OFICIAIS_INTERMEDIARIOS";
  }

  if (
    patente.includes("1º Tenente") ||
    patente.includes("2º Tenente")
  ) {
    return "OFICIAIS_SUBALTERNOS";
  }

  if (patente.includes("Aspirante")) {
    return "PRACAS_ESPECIAIS";
  }

  if (
    patente.includes("Subtenente") ||
    patente.includes("1º Sargento") ||
    patente.includes("2º Sargento") ||
    patente.includes("3º Sargento")
  ) {
    return "PRACAS_GRADUADAS";
  }

  if (
    patente.includes("Cabo") ||
    patente.includes("Soldado 1ª Classe")
  ) {
    return "PRACAS";
  }

  if (patente.includes("Soldado 2ª Classe")) {
    return "ESTAGIARIOS";
  }

  return "ESTAGIARIOS";
};

/**
 * ✅ NOVO — peso militar da patente
 * ⚠️ NÃO remove nada existente
 */
exports.getPesoPatente = (patente = "") => {
  const ordem = [
    "Coronel",
    "Tenente-Coronel",
    "Major",
    "Capitão",
    "1º Tenente",
    "2º Tenente",
    "Aspirante",
    "Subtenente",
    "1º Sargento",
    "2º Sargento",
    "3º Sargento",
    "Cabo",
    "Soldado 1ª Classe",
    "Soldado 2ª Classe"
  ];

  const index = ordem.findIndex(p => patente.includes(p));
  return index === -1 ? 999 : index;
};
