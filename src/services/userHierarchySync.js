const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");

/* ==========================
   NORMALIZA CATEGORIA
========================== */
const normalizarCategoria = (categoria) => {
  if (!categoria) return categoria;

  return categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");
};

exports.syncUserFromHierarchy = async (user) => {
  if (!user) return user;

  const h = await Hierarchy.findOne({
    funcional: user.funcional,
    status: "Ativo"
  });

  if (!h) return user;

  let atualizado = false;

  // 🔰 PATENTE
  if (user.patente !== h.patente) {
    user.patente = h.patente;
    atualizado = true;
  }

  // 🔥 CATEGORIA (NORMALIZADA)
  const categoriaNormalizada = normalizarCategoria(h.categoria);

  if (user.categoriaHierarquia !== categoriaNormalizada) {
    user.categoriaHierarquia = categoriaNormalizada;
    atualizado = true;
  }

  // 🔰 FUNÇÃO
  if (user.funcao !== h.funcao) {
    user.funcao = h.funcao;
    atualizado = true;
  }

  if (atualizado) {
    await user.save(); // ← agora nunca mais salva com acento
  }

  return user;
};
