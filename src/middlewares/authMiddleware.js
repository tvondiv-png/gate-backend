const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { syncUserFromHierarchy } = require("../services/userHierarchySync");

const protect = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token não fornecido" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "Usuário inválido" });
      }

      // 🔥 SINCRONIZA COM HIERARQUIA
      user = await syncUserFromHierarchy(user);

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("Erro no authMiddleware:", err);
      return res.status(401).json({ message: "Token inválido" });
    }
  };
};

module.exports = { protect };
