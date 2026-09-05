const RSO = require("../models/RSO");
const User = require("../models/User");

const policialEstaNaEquipeFixa = (rso, funcional) => {
  return (
    Number(rso?.equipeFixa?.chefe?.funcional) === Number(funcional) ||
    Number(rso?.equipeFixa?.auxiliar?.funcional) === Number(funcional)
  );
};

const policialEstaNaEquipeRotativa = (rso, funcional) => {
  return Object.values(rso?.equipeRotativa || {}).some(
    (lista) =>
      Array.isArray(lista) &&
      lista.some(
        (p) =>
          Number(p?.funcional) === Number(funcional) &&
          String(p?.status || "Ativo") === "Ativo"
      )
  );
};

exports.policialEmRSOAtivo = async (funcional) => {
  const rsos = await RSO.find({ status: "Ativo" }).lean();

  return rsos.some(
    (rso) =>
      policialEstaNaEquipeFixa(rso, funcional) ||
      policialEstaNaEquipeRotativa(rso, funcional)
  );
};

exports.buscarRSOAtivoDoPolicial = async (funcional) => {
  const rsos = await RSO.find({ status: "Ativo" }).lean();

  const rsoEncontrado = rsos.find(
    (rso) =>
      policialEstaNaEquipeFixa(rso, funcional) ||
      policialEstaNaEquipeRotativa(rso, funcional)
  );

  if (!rsoEncontrado) {
    return null;
  }

  let criadoPor = {
    id: null,
    nome: "Não identificado",
    patente: "",
    funcional: ""
  };

  if (rsoEncontrado.criadoPor) {
    const usuario = await User.findById(rsoEncontrado.criadoPor)
      .select("_id nome patente funcional")
      .lean();

    if (usuario) {
      criadoPor = {
        id: usuario._id,
        nome: usuario.nome || "Não identificado",
        patente: usuario.patente || "",
        funcional: usuario.funcional || ""
      };
    }
  }

  const chefe = rsoEncontrado?.equipeFixa?.chefe
    ? {
        nome: rsoEncontrado.equipeFixa.chefe.nome || "",
        patente: rsoEncontrado.equipeFixa.chefe.patente || "",
        funcional: rsoEncontrado.equipeFixa.chefe.funcional || ""
      }
    : null;

  return {
    _id: rsoEncontrado._id,
    viatura: rsoEncontrado.viatura || "-",
    criadoPor,
    chefe,
    createdAt: rsoEncontrado.createdAt || null
  };
};