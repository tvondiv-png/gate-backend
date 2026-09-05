const bcrypt = require("bcryptjs");

const User = require("../models/User");

const Hierarchy = require(
  "../models/Hierarchy"
);

const logAction = require(
  "../utils/logAction"
);

/* =========================================================
   LISTAR USUÁRIOS
========================================================= */

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({
        funcional: 1
      })
      .lean();

    const funcionais = users
      .map((u) => u.funcional)
      .filter(
        (funcional) =>
          funcional !== undefined &&
          funcional !== null
      );

    const hierarquias =
      await Hierarchy.find({
        funcional: {
          $in: funcionais
        }
      })
        .select(
          "funcional patente categoria funcao status qualificacaoRocam"
        )
        .lean();

    const mapaHierarquia =
      new Map(
        hierarquias.map((h) => [
          Number(h.funcional),
          h
        ])
      );

    const result = users.map((u) => {
      const h =
        mapaHierarquia.get(
          Number(u.funcional)
        );

      return {
        ...u,

        patente:
          h?.patente ||
          u.patente ||
          "",

        categoriaHierarquia:
          h?.categoria ||
          u.categoriaHierarquia ||
          "",

        funcao:
          h?.funcao ||
          u.funcao ||
          "",

        qualificacaoRocam:
          h?.qualificacaoRocam ||
          u.qualificacaoRocam ||
          "NENHUM",

        status:
          h?.status ||
          u.status ||
          "Ativo"
      };
    });

    return res.json(result);
  } catch (err) {
    console.error(
      "Erro ao listar usuários:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao listar usuários"
    });
  }
};

/* =========================================================
   ATUALIZAR ROLE
========================================================= */

exports.updateRole = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { role } = req.body;

    /* =====================================================
       VALIDAR ROLE
    ===================================================== */

    const rolesPermitidas = [
      "user",
      "admin",
      "superadmin"
    ];

    if (
      !rolesPermitidas.includes(role)
    ) {
      return res.status(400).json({
        message:
          "Nível de acesso inválido"
      });
    }

    /* =====================================================
       LOCALIZAR USUÁRIO
    ===================================================== */

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message:
          "Usuário não encontrado"
      });
    }

    /* =====================================================
       BLOQUEAR ALTERAÇÃO DO PRÓPRIO ROLE

       Evita que o SuperADM remova o próprio
       acesso administrativo por engano.
    ===================================================== */

    if (
      String(user._id) ===
      String(req.user.id)
    ) {
      return res.status(400).json({
        message:
          "Você não pode alterar o nível de acesso da própria conta"
      });
    }

    /* =====================================================
       NÃO FAZER NADA SE JÁ FOR A MESMA ROLE
    ===================================================== */

    if (user.role === role) {
      return res.json({
        message:
          "O usuário já possui este nível de acesso"
      });
    }

    const oldRole = user.role;

    user.role = role;

    await user.save();

    /* =====================================================
       LOG
    ===================================================== */

    await logAction({
      usuario: req.user.id,
      acao:
        "ALTERAÇÃO DE ROLE",
      modulo:
        "SUPERADMIN",
      alvoId:
        user._id,
      detalhes:
        `Role de ${user.nome} (${user.funcional}) alterada de ${oldRole} para ${role}`
    });

    return res.json({
      message:
        "Nível de acesso atualizado com sucesso",

      user: {
        _id:
          user._id,

        funcional:
          user.funcional,

        nome:
          user.nome,

        role:
          user.role
      }
    });
  } catch (err) {
    console.error(
      "Erro ao atualizar role:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao atualizar nível de acesso"
    });
  }
};

/* =========================================================
   EXCLUIR USUÁRIO
========================================================= */

exports.deleteUser = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message:
          "Usuário não encontrado"
      });
    }

    /* =====================================================
       BLOQUEAR AUTOEXCLUSÃO
    ===================================================== */

    if (
      String(user._id) ===
      String(req.user.id)
    ) {
      return res.status(400).json({
        message:
          "Você não pode excluir a própria conta de Superadministrador"
      });
    }

    const dadosLog = {
      id:
        user._id,

      nome:
        user.nome,

      funcional:
        user.funcional,

      role:
        user.role
    };

    /* =====================================================
       REMOVER HIERARQUIA VINCULADA

       Isso evita deixar um registro órfão
       apontando para um usuário inexistente.
    ===================================================== */

    await Hierarchy.deleteOne({
      user: user._id
    });

    /* =====================================================
       REMOVER USUÁRIO
    ===================================================== */

    await user.deleteOne();

    /* =====================================================
       LOG
    ===================================================== */

    await logAction({
      usuario:
        req.user.id,

      acao:
        "EXCLUSÃO DE USUÁRIO",

      modulo:
        "SUPERADMIN",

      alvoId:
        dadosLog.id,

      detalhes:
        `Usuário ${dadosLog.nome} (funcional ${dadosLog.funcional} / role ${dadosLog.role}) excluído`
    });

    return res.json({
      message:
        "Usuário excluído com sucesso"
    });
  } catch (err) {
    console.error(
      "Erro ao excluir usuário:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao excluir usuário"
    });
  }
};

/* =========================================================
   RESETAR SENHA
========================================================= */

exports.resetarSenha = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message:
          "Usuário não encontrado"
      });
    }

    /* =====================================================
       EVITAR RESET PRÓPRIO PELO PAINEL SUPERADMIN
    ===================================================== */

    if (
      String(user._id) ===
      String(req.user.id)
    ) {
      return res.status(400).json({
        message:
          "Utilize a alteração de senha da própria conta para modificar sua senha"
      });
    }

    /* =====================================================
       SENHA TEMPORÁRIA PADRÃO
    ===================================================== */

    const novaSenha = "123456";

    const hash =
      await bcrypt.hash(
        novaSenha,
        10
      );

    user.senha = hash;

    user.senhaPadrao = true;

    await user.save();

    /* =====================================================
       LOG
    ===================================================== */

    await logAction({
      usuario:
        req.user.id,

      acao:
        "RESET DE SENHA",

      modulo:
        "SUPERADMIN",

      alvoId:
        user._id,

      detalhes:
        `Senha de ${user.nome} (${user.funcional}) resetada para senha temporária`
    });

    return res.json({
      message:
        "Senha resetada com sucesso",

      senhaTemporaria:
        novaSenha
    });
  } catch (err) {
    console.error(
      "Erro ao resetar senha:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao resetar senha"
    });
  }
};