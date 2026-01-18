const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");

exports.syncUserFromHierarchy = async (user) => {
  if (!user) return user;

  const h = await Hierarchy.findOne({
    funcional: user.funcional,
    status: "Ativo"
  });

  if (!h) return user;

  let atualizado = false;

  if (user.patente !== h.patente) {
    user.patente = h.patente;
    atualizado = true;
  }

  if (user.categoriaHierarquia !== h.categoria) {
    user.categoriaHierarquia = h.categoria;
    atualizado = true;
  }

  if (user.funcao !== h.funcao) {
    user.funcao = h.funcao;
    atualizado = true;
  }

  if (atualizado) {
    await user.save();
  }

  return user;
};
