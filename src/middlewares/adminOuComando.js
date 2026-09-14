/* =========================================================
   Libera admin/superadmin (uso normal do Painel ADM) OU quem
   exerce Comando/Subcomando do Batalhão, mesmo com role "user"
   (caso do Painel de Comando, que autoriza por função, não só
   por role). Usar depois de protect([...]).
========================================================= */
module.exports = function adminOuComando(req, res, next) {
  const role = req.user?.role;
  const funcao = req.user?.funcao;

  const permitido =
    role === "admin" ||
    role === "superadmin" ||
    role === "comando" ||
    funcao === "Comando do Batalhão" ||
    funcao === "Subcomando do Batalhão";

  if (!permitido) {
    return res.status(403).json({ message: "Acesso negado" });
  }

  next();
};
