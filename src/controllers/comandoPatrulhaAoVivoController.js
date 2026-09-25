const RSO = require("../models/RSO");

/* =========================================================
   PAINEL AO VIVO DE PATRULHAMENTO (COMANDO)

   Mostra, em tempo (quase) real, quais viaturas estão com
   RSO ativo agora e quem está em cada uma.
========================================================= */
exports.getPatrulhaAoVivo = async (req, res) => {
  try {
    const rsos = await RSO.find({ status: "Ativo" })
      .select("viatura tipoPatrulhamento equipe equipeFixa equipeRotativa createdAt")
      .sort({ createdAt: -1 })
      .lean();

    let totalPoliciais = 0;

    const viaturas = rsos.map((r) => {
      // suporta o modelo novo (equipe[]) e o antigo (equipeFixa/equipeRotativa)
      let integrantes = [];

      if (Array.isArray(r.equipe) && r.equipe.length > 0) {
        integrantes = r.equipe;
      } else {
        const antigos = [
          r.equipeFixa?.chefe,
          r.equipeFixa?.auxiliar,
          ...(r.equipeRotativa?.motorista || []),
          ...(r.equipeRotativa?.terceiro || []),
          ...(r.equipeRotativa?.quarto || []),
          ...(r.equipeRotativa?.quinto || [])
        ].filter(Boolean);
        integrantes = antigos;
      }

      integrantes = integrantes.filter((i) => i.status !== "Encerrado");
      totalPoliciais += integrantes.length;

      return {
        id: r._id,
        viatura: r.viatura,
        tipoPatrulhamento: r.tipoPatrulhamento || "VIATURA",
        desde: r.createdAt,
        integrantes: integrantes.map((i) => ({
          nome: i.nome,
          patente: i.patente,
          cargo: i.cargo
        }))
      };
    });

    return res.json({
      atualizadoEm: new Date(),
      totalViaturas: viaturas.length,
      totalPoliciais,
      viaturas
    });
  } catch (err) {
    console.error("Erro getPatrulhaAoVivo:", err);
    return res
      .status(500)
      .json({ message: "Erro ao carregar o patrulhamento ao vivo" });
  }
};

/* =========================================================
   RESUMO PÚBLICO (só contadores, sem identificar ninguém)
========================================================= */
exports.getResumoPublico = async (req, res) => {
  try {
    const rsos = await RSO.find({ status: "Ativo" })
      .select("equipe equipeFixa equipeRotativa")
      .lean();

    let totalPoliciais = 0;
    for (const r of rsos) {
      if (Array.isArray(r.equipe) && r.equipe.length > 0) {
        totalPoliciais += r.equipe.filter((i) => i.status !== "Encerrado").length;
      } else {
        const antigos = [
          r.equipeFixa?.chefe,
          r.equipeFixa?.auxiliar,
          ...(r.equipeRotativa?.motorista || []),
          ...(r.equipeRotativa?.terceiro || []),
          ...(r.equipeRotativa?.quarto || []),
          ...(r.equipeRotativa?.quinto || [])
        ].filter((i) => i && i.status !== "Encerrado");
        totalPoliciais += antigos.length;
      }
    }

    return res.json({
      viaturasAtivas: rsos.length,
      policiaisEmPatrulha: totalPoliciais
    });
  } catch (err) {
    console.error("Erro getResumoPublico:", err);
    return res.status(500).json({ message: "Erro ao carregar resumo" });
  }
};
