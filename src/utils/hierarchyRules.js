exports.definirCategoriaPorPatente = (patente) => {
  if (!patente) return "ESTAGIARIOS";

  // ===== OFICIAIS SUPERIORES =====
  if (
    patente.includes("Coronel") ||
    patente.includes("Tenente-Coronel") ||
    patente.includes("Major")
  ) {
    return "OFICIAIS_SUPERIORES";
  }

  // ===== OFICIAIS INTERMEDIÁRIOS =====
  if (patente.includes("Capitão")) {
    return "OFICIAIS_INTERMEDIARIOS";
  }

  // ===== OFICIAIS SUBALTERNOS =====
  if (
    patente.includes("1º Tenente") ||
    patente.includes("2º Tenente")
  ) {
    return "OFICIAIS_SUBALTERNOS";
  }

  // ===== PRAÇAS ESPECIAIS =====
  if (patente.includes("Aspirante")) {
    return "PRACAS_ESPECIAIS";
  }

  // ===== PRAÇAS GRADUADAS =====
  if (
    patente.includes("Subtenente") ||
    patente.includes("1º Sargento") ||
    patente.includes("2º Sargento") ||
    patente.includes("3º Sargento")
  ) {
    return "PRACAS_GRADUADAS";
  }

  // ===== PRAÇAS =====
  if (
    patente.includes("Cabo") ||
    patente.includes("Soldado 1ª Classe")
  ) {
    return "PRACAS";
  }

  // ===== ESTAGIÁRIOS =====
  if (patente.includes("Soldado 2ª Classe")) {
    return "ESTAGIARIOS";
  }

  return "ESTAGIARIOS";
};
