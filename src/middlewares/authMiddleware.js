const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * 🔐 Middleware de proteção com controle de roles
 */
exports.protect = (roles = []) => {
  return async (req, res, next) => {
    try {
      let token;

      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      // 🔒 valida role se foi informada
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token inválido" });
    }
  };
};
