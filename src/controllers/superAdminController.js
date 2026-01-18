const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");
const logAction = require("../utils/logAction");

// ======================
// LISTAR USUÁRIOS
// ======================
exports.listUsers = async (req, res) => {
  const users = await User.find().sort({ funcional: 1 });

  const result = await Promise.all(
    users.map(async (u) => {
      const h = await Hierarchy.findOne({
        funcional: u.funcional,
        status: "Ativo"
      });

      return {
        ...u.toObject(),
        patente: h?.patente || "",
        categoriaHierarquia: h?.categoria || "",
        funcao: h?.funcao || ""
      };
    })
  );

  res.json(result);
};

// ======================
// ATUALIZAR ROLE
// ======================
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({ message: "Role inválida" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAction({
      usuario: req.user.id,
      acao: "ALTERAÇÃO DE ROLE",
      modulo: "SUPERADMIN",
      alvoId: user._id,
      detalhes: `Role alterada de ${oldRole} para ${role}`
    });

    res.json({ message: "Role atualizada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar role" });
  }
};

// ======================
// EXCLUIR USUÁRIO
// ======================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    await user.deleteOne();

    await logAction({
      usuario: req.user.id,
      acao: "EXCLUSÃO DE USUÁRIO",
      modulo: "SUPERADMIN",
      alvoId: user._id,
      detalhes: `Usuário ${user.nome} (funcional ${user.funcional}) excluído`
    });

    res.json({ message: "Usuário excluído com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir usuário" });
  }
};

// ======================
// RESETAR SENHA (123456)
// ======================
exports.resetarSenha = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const novaSenha = "123456";
  const hash = await bcrypt.hash(novaSenha, 10);

  user.senha = hash;
  user.senhaPadrao = true;
  await user.save();

  await logAction({
    usuario: req.user.id,
    acao: "RESET DE SENHA",
    modulo: "SUPERADMIN",
    alvoId: user._id,
    detalhes: "Senha resetada para padrão (123456)"
  });

  res.json({
    message: "Senha resetada com sucesso. Senha padrão: 123456"
  });
};
