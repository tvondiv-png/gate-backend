const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    let { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ message: "Login e senha obrigatórios" });
    }

    login = String(login).trim().toLowerCase();
    senha = String(senha).trim();

    const isEmail = login.includes("@");

    let query;

    if (isEmail) {
      query = { email: login };
    } else {
      const funcional = parseInt(login, 10);

      if (Number.isNaN(funcional)) {
        return res.status(400).json({ message: "Número funcional inválido" });
      }

      query = { funcional };
    }

    const user = await User.findOne(query);

    console.log("LOGIN RECEBIDO:", login);
    console.log("USUÁRIO ENCONTRADO:", !!user);

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    if (!user.senha) {
      return res.status(500).json({ message: "Usuário sem senha cadastrada" });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: "Senha inválida" });
    }

    if (user.status === "Afastado") {
      return res.status(403).json({ message: "Usuário inativo" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        funcao: user.funcao || ""
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        nome: user.nome,
        funcional: user.funcional,
        role: user.role,
        patente: user.patente,
        funcao: user.funcao || "",
        status: user.status,
        senhaPadrao: !!user.senhaPadrao
      }
    });
  } catch (error) {
    console.error("❌ Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no login" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { senha } = req.body;

    if (!senha || senha.length < 6) {
      return res.status(400).json({ message: "Senha inválida" });
    }

    const hash = await bcrypt.hash(senha, 10);

    req.user.senha = hash;
    req.user.senhaPadrao = false;
    await req.user.save();

    return res.json({ message: "Senha alterada com sucesso" });
  } catch (err) {
    console.error("Erro ao trocar senha:", err);
    return res.status(500).json({ message: "Erro ao trocar senha" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = req.user;

    return res.json({
      id: user._id,
      nome: user.nome,
      funcional: user.funcional,
      role: user.role,
      patente: user.patente,
      funcao: user.funcao || "",
      status: user.status,
      senhaPadrao: !!user.senhaPadrao
    });
  } catch (error) {
    console.error("Erro ao buscar usuário logado:", error);
    return res.status(500).json({ message: "Erro ao buscar usuário logado" });
  }
};