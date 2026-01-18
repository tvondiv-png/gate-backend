exports.getCategoriaCor = (categoria) => {
  const cores = {
    OFICIAIS_SUPERIORES: "#F5F5F5",     // branco gelo
    OFICIAIS_SUBALTERNOS: "#2ECC71",    // verde
    OFICIAIS_INTERMEDIARIOS: "#F1C40F", // amarelo
    PRACAS_ESPECIAIS: "#3498DB",        // azul
    PRACAS_GRADUADAS: "#E74C3C",        // vermelho
    PRACAS: "#95A5A6",                  // cinza
    ESTAGIARIOS: "#DCDCDC"              // cinza claro
  };

  return cores[categoria] || "#FFFFFF";
};
