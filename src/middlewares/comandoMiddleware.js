module.exports = function onlyComando(req, res, next) {
  const funcao = req.user?.funcao;
  const role = req.user?.role;

  const permitido =
    role === "superadmin" ||
    funcao === "Comando do Batalhão" ||
    funcao === "Subcomando do Batalhão";

  if (!permitido) {
    return res.status(403).json({
      message: "Acesso restrito ao Comando, Subcomando ou Superadmin"
    });
  }

  next();
};