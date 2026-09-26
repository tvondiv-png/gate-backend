const RSO = require("../models/RSO");
const RocamProfile = require("../models/RocamProfile");
const PatrolHours = require("../models/PatrolHours");

/* =========================================================
   PATRULHAMENTO ROCAM AO VIVO (COMANDO)

   Mesma lógica do painel do Comando geral, mas só viaturas
   marcadas como tipoPatrulhamento "ROCAM".
========================================================= */

exports.getPatrulhaAoVivo = async (req, res) => {
  try {
    const rsos = await RSO.find({
      status: "Ativo",
      tipoPatrulhamento: "ROCAM"
    })
      .select("viatura equipe equipeFixa equipeRotativa createdAt")
      .sort({ createdAt: -1 })
      .lean();

    let totalPoliciais = 0;

    const viaturas = rsos.map((r) => {
      let integrantes = [];

      if (Array.isArray(r.equipe) && r.equipe.length > 0) {
        integrantes = r.equipe;
      } else {
        integrantes = [
          r.equipeFixa?.chefe,
          r.equipeFixa?.auxiliar,
          ...(r.equipeRotativa?.motorista || []),
          ...(r.equipeRotativa?.terceiro || []),
          ...(r.equipeRotativa?.quarto || []),
          ...(r.equipeRotativa?.quinto || [])
        ].filter(Boolean);
      }

      integrantes = integrantes.filter((i) => i.status !== "Encerrado");
      totalPoliciais += integrantes.length;

      return {
        id: r._id,
        viatura: r.viatura,
        desde: r.createdAt,
        integrantes: integrantes.map((i) => ({
          nome: i.nome,
          patente: i.patente,
          cargo: i.cargo,
          qualificacaoRocam: i.qualificacaoRocam || "NENHUM"
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
    console.error("Erro getPatrulhaAoVivo ROCAM:", err);
    return res.status(500).json({
      message: "Erro ao carregar o patrulhamento ROCAM ao vivo"
    });
  }
};

/* =========================================================
   HORAS DO EFETIVO ROCAM (COMANDO)

   Junta o efetivo ROCAM ativo (Comando, Subcomando, Braçal
   e Estagiário) com as horas de patrulha já contabilizadas
   no PatrolHours (mesma base usada no painel ADM).
========================================================= */

exports.getHorasEfetivo = async (req, res) => {
  try {
    const perfis = await RocamProfile.find({ ativo: true })
      .select("user funcional nome patente papelRocam situacaoRocam")
      .lean();

    const funcionais = perfis.map((p) => p.funcional);

    const horas = await PatrolHours.find({
      funcional: { $in: funcionais }
    })
      .select(
        "funcional status horasSemanaMin horasMesMin horasRocamSemanaMin horasRocamMesMin ausenciaPatrulhamento observacaoAusencia"
      )
      .lean();

    const horasPorFuncional = new Map(
      horas.map((h) => [Number(h.funcional), h])
    );

    const efetivo = perfis.map((perfil) => {
      const h = horasPorFuncional.get(Number(perfil.funcional));

      return {
        user: perfil.user,
        funcional: perfil.funcional,
        nome: perfil.nome,
        patente: perfil.patente,
        papelRocam: perfil.papelRocam,
        situacaoRocam: perfil.situacaoRocam,
        status: h?.status || "Ativo",
        horasSemanaMin: h?.horasSemanaMin || 0,
        horasMesMin: h?.horasMesMin || 0,
        horasRocamSemanaMin: h?.horasRocamSemanaMin || 0,
        horasRocamMesMin: h?.horasRocamMesMin || 0,
        ausenciaPatrulhamento: h?.ausenciaPatrulhamento || "normal",
        observacaoAusencia: h?.observacaoAusencia || ""
      };
    });

    efetivo.sort(
      (a, b) => (b.horasRocamSemanaMin || 0) - (a.horasRocamSemanaMin || 0)
    );

    const totalSemanaMin = efetivo.reduce(
      (acc, item) => acc + (item.horasSemanaMin || 0),
      0
    );
    const totalMesMin = efetivo.reduce(
      (acc, item) => acc + (item.horasMesMin || 0),
      0
    );
    const totalRocamSemanaMin = efetivo.reduce(
      (acc, item) => acc + (item.horasRocamSemanaMin || 0),
      0
    );
    const totalRocamMesMin = efetivo.reduce(
      (acc, item) => acc + (item.horasRocamMesMin || 0),
      0
    );

    return res.json({
      efetivo,
      resumo: {
        total: efetivo.length,
        zeroSemana: efetivo.filter(
          (i) => (i.horasRocamSemanaMin || 0) === 0
        ).length,
        totalSemanaMin,
        totalMesMin,
        totalRocamSemanaMin,
        totalRocamMesMin,
        mediaSemanaMin: efetivo.length
          ? Math.round(totalSemanaMin / efetivo.length)
          : 0,
        mediaRocamSemanaMin: efetivo.length
          ? Math.round(totalRocamSemanaMin / efetivo.length)
          : 0
      }
    });
  } catch (err) {
    console.error("Erro getHorasEfetivo ROCAM:", err);
    return res.status(500).json({
      message: "Erro ao carregar horas do efetivo ROCAM"
    });
  }
};
