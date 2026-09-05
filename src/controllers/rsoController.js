const RSO = require("../models/RSO");
const Hierarchy = require("../models/Hierarchy");
const User = require("../models/User");

const {
  calcularMinutos
} = require("../services/rsoTimeService");

const {
  policialEmRSOAtivo,
  buscarRSOAtivoDoPolicial
} = require("../services/rsoRulesService");

/* =========================================================
   VIATURAS DO 2º BPChq ANCHIETA
========================================================= */

const VIATURAS_ANCHIETA = [
  "COMANDO ANCHIETA - 92000",
  "SUBCOMANDO ANCHIETA - 92001",
  "COORDENADOR ANCHIETA - 92002",
  "ANCHIETA COMANDO DOIS - 92200",
  "ANCHIETA 224 - 92224",
  "ANCHIETA 223 - 92223",
  "ANCHIETA 222 - 92222",
  "ANCHIETA 216 - 92216"
];

const VIATURAS_ROCAM = [
  "ROCAM COMANDO QUATRO - 92404",
  "ROCAM 416 - 92416 (APOIO 4 RODAS)",
  "ROCAM 321 - 9232"
];

/* =========================================================
   HELPERS
========================================================= */

const normalizarTipoPatrulhamento = (valor) => {
  const tipo = String(valor || "VIATURA")
    .trim()
    .toUpperCase();

  return tipo === "ROCAM"
    ? "ROCAM"
    : "VIATURA";
};

const normalizarCargo = (cargo) => {
  const valor = String(cargo || "")
    .trim()
    .toLowerCase();

  if (valor === "encarregado") {
    return "Encarregado";
  }

  if (valor === "motorista") {
    return "Motorista";
  }

  return "Operador";
};

const policialPodeRocam = (hierarquia) => {
  return [
    "BRACAL_ROCAM",
    "ESTAGIARIO_ROCAM"
  ].includes(
    hierarquia?.qualificacaoRocam
  );
};

const buscarPolicialHierarquia = async (
  funcional,
  tipoPatrulhamento,
  cargo
) => {
  const numeroFuncional =
    Number(funcional);

  if (
    !numeroFuncional ||
    numeroFuncional <= 0
  ) {
    throw new Error(
      "Funcional inválida"
    );
  }

  if (
    await policialEmRSOAtivo(
      numeroFuncional
    )
  ) {
    const conflito =
      await montarMensagemConflito(
        numeroFuncional,
        cargo || "Policial"
      );

    const error =
      new Error(
        conflito.message
      );

    error.statusCode = 400;
    error.extra = conflito;

    throw error;
  }

  const h =
    await Hierarchy.findOne({
      funcional:
        numeroFuncional,

      status:
        "Ativo"
    });

  if (!h) {
    throw new Error(
      "Policial inválido ou não está ativo na hierarquia"
    );
  }

  if (
    tipoPatrulhamento ===
      "ROCAM" &&
    !policialPodeRocam(h)
  ) {
    throw new Error(
      `${h.patente || ""} ${h.nome || ""} não possui Braçal ROCAM ou condição de Estagiário ROCAM.`
    );
  }

  return {
    funcional:
      h.funcional,

    nome:
      h.nome,

    patente:
      h.patente,

    cargo:
      normalizarCargo(
        cargo
      ),

    qualificacaoRocam:
      h.qualificacaoRocam ||
      "NENHUM",

    horaEntrada:
      new Date(),

    horaSaida:
      null,

    tempoMinutos:
      0,

    status:
      "Ativo"
  };
};

/* =========================================================
   DADOS DO RSO CONFLITANTE
========================================================= */

const montarDadosConflito =
  async (funcional) => {
    const conflito =
      await buscarRSOAtivoDoPolicial(
        funcional
      );

    if (!conflito) {
      return null;
    }

    return {
      _id:
        conflito._id,

      tipoPatrulhamento:
        conflito.tipoPatrulhamento ||
        "VIATURA",

      viatura:
        conflito.viatura || "-",

      createdAt:
        conflito.createdAt || null,

      criadoPor:
        conflito.criadoPor || null,

      chefe:
        conflito.chefe || null,

      responsavel:
        conflito.responsavel || null
    };
  };

/* =========================================================
   MENSAGEM DE CONFLITO
========================================================= */

const montarMensagemConflito =
  async (
    funcional,
    cargoLabel
  ) => {
    const policial =
      await Hierarchy.findOne({
        funcional:
          Number(funcional),

        status:
          "Ativo"
      })
        .select(
          "nome funcional patente"
        )
        .lean();

    const conflito =
      await montarDadosConflito(
        funcional
      );

    if (!conflito) {
      return {
        message:
          `${cargoLabel} selecionado já possui ponto aberto em outro RSO ativo.`,

        rsoConflitante:
          null,

        policialConflitante:
          policial
            ? {
                nome:
                  policial.nome ||
                  "",

                funcional:
                  policial.funcional ||
                  null,

                patente:
                  policial.patente ||
                  ""
              }
            : null
      };
    }

    const policialTexto =
      policial
        ? `${
            policial.patente
              ? `${policial.patente} `
              : ""
          }${policial.nome} (${policial.funcional})`
        : `Funcional ${funcional}`;

    const criadoPor =
      conflito.criadoPor;

    let abriu =
      "Não identificado";

    if (criadoPor) {
      if (
        typeof criadoPor ===
        "string"
      ) {
        abriu =
          criadoPor;
      } else {
        abriu =
          `${
            criadoPor.patente
              ? `${criadoPor.patente} `
              : ""
          }${
            criadoPor.nome ||
            "Não identificado"
          }${
            criadoPor.funcional
              ? ` (${criadoPor.funcional})`
              : ""
          }`;
      }
    }

    const responsavel =
      conflito.responsavel ||
      conflito.chefe;

    const responsavelTexto =
      responsavel
        ? `${
            responsavel.patente
              ? `${responsavel.patente} `
              : ""
          }${
            responsavel.nome ||
            "Não identificado"
          }${
            responsavel.funcional
              ? ` (${responsavel.funcional})`
              : ""
          }`
        : "Não identificado";

    return {
      message:
        `${cargoLabel}: ${policialTexto} já possui ponto aberto em outro RSO ativo. ` +
        `Viatura: ${conflito.viatura}. ` +
        `Aberto por: ${abriu}. ` +
        `Responsável: ${responsavelTexto}.`,

      rsoConflitante:
        conflito,

      policialConflitante:
        policial
          ? {
              nome:
                policial.nome ||
                "",

              funcional:
                policial.funcional ||
                null,

              patente:
                policial.patente ||
                ""
            }
          : null
    };
  };

/* =========================================================
   VERIFICA FUNCIONAIS DUPLICADAS NA ABERTURA
========================================================= */

const validarDuplicidadeEquipe =
  (equipe) => {
    const vistos =
      new Set();

    for (const item of equipe) {
      const funcional =
        Number(
          item?.funcional
        );

      if (!funcional) {
        continue;
      }

      if (
        vistos.has(
          funcional
        )
      ) {
        throw new Error(
          `A funcional ${funcional} foi adicionada mais de uma vez na equipe.`
        );
      }

      vistos.add(
        funcional
      );
    }
  };

/* =========================================================
   LISTAR MEUS RSOs
========================================================= */

exports.meusRSOs = async (
  req,
  res
) => {
  try {
    const rsos =
      await RSO.find({
        criadoPor:
          req.user.id
      }).sort({
        createdAt: -1
      });

    return res.json(rsos);
  } catch (error) {
    console.error(
      "Erro ao listar RSOs:",
      error
    );

    return res.status(500).json({
      message:
        "Erro ao listar RSOs"
    });
  }
};

/* =========================================================
   ABRIR RSO
========================================================= */

exports.abrirRSO = async (
  req,
  res
) => {
  try {
    /*
     * =====================================================
     * NOVO MODELO
     * =====================================================
     *
     * Payload esperado:
     *
     * {
     *   tipoPatrulhamento: "VIATURA" | "ROCAM",
     *   viatura: "...",
     *   equipe: [
     *     {
     *       funcional: 123,
     *       cargo: "Encarregado"
     *     }
     *   ]
     * }
     *
     */

    if (
      Array.isArray(
        req.body.equipe
      )
    ) {
      const tipoPatrulhamento =
        normalizarTipoPatrulhamento(
          req.body
            .tipoPatrulhamento
        );

      const viatura =
        String(
          req.body.viatura ||
          ""
        ).trim();

      const equipeRecebida =
        req.body.equipe;

      if (!viatura) {
        return res
          .status(400)
          .json({
            message:
              "Viatura é obrigatória"
          });
      }

      /* =====================================================
         VIATURA
      ===================================================== */

      if (
        tipoPatrulhamento ===
        "VIATURA"
      ) {
        if (
          !VIATURAS_ANCHIETA.includes(
            viatura
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Viatura Anchieta inválida"
            });
        }

        if (
          equipeRecebida.length <
          1
        ) {
          return res
            .status(400)
            .json({
              message:
                "Adicione pelo menos um integrante ao RSO."
            });
        }
      }

      /* =====================================================
         ROCAM
      ===================================================== */

      if (
        tipoPatrulhamento ===
        "ROCAM"
      ) {
        if (
          !VIATURAS_ROCAM.includes(
            viatura
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Viatura ROCAM inválida"
            });
        }

        if (
          equipeRecebida.length <
          2
        ) {
          return res
            .status(400)
            .json({
              message:
                "Uma equipe ROCAM deve possuir no mínimo 2 integrantes para abertura do RSO."
            });
        }

        /* ===============================================
           ROCAM PRECISA DE EXATAMENTE 1 ENCARREGADO
        =============================================== */

        const encarregados =
          equipeRecebida.filter(
            (item) =>
              normalizarCargo(
                item?.cargo
              ) ===
              "Encarregado"
          );

        if (
          encarregados.length !==
          1
        ) {
          return res
            .status(400)
            .json({
              message:
                "A equipe ROCAM deve possuir exatamente 1 Encarregado."
            });
        }

        /* ===============================================
           ROCAM SÓ ACEITA:
           - Encarregado
           - Operador
        =============================================== */

        const cargosInvalidos =
          equipeRecebida.filter(
            (item) => {
              const cargoNormalizado =
                normalizarCargo(
                  item?.cargo
                );

              return ![
                "Encarregado",
                "Operador"
              ].includes(
                cargoNormalizado
              );
            }
          );

        if (
          cargosInvalidos.length >
          0
        ) {
          return res
            .status(400)
            .json({
              message:
                "Na ROCAM os cargos permitidos são Encarregado e Operador."
            });
        }
      }

      /* =====================================================
         NÃO PERMITE POLICIAL DUPLICADO
      ===================================================== */

      validarDuplicidadeEquipe(
        equipeRecebida
      );

      const equipeNova = [];

      /* =====================================================
         MONTA EQUIPE
      ===================================================== */

      for (
        const item of
        equipeRecebida
      ) {
        const integrante =
          await buscarPolicialHierarquia(
            item.funcional,
            tipoPatrulhamento,
            item.cargo
          );

        equipeNova.push(
          integrante
        );
      }

      /* =====================================================
         CRIA RSO
      ===================================================== */

      const rso =
        await RSO.create({
          tipoPatrulhamento,

          viatura,

          equipe:
            equipeNova,

          /*
           * Estruturas antigas ficam vazias.
           * Elas continuam no Model apenas
           * para compatibilidade histórica.
           */
          equipeFixa: {},

          equipeRotativa: {
            motorista: [],
            terceiro: [],
            quarto: [],
            quinto: []
          },

          observacoes:
            "",

          apreensoes:
            [],

          criadoPor:
            req.user.id
        });

      return res
        .status(201)
        .json(rso);
    }

    /* =====================================================
       MODELO ANTIGO

       Mantido para compatibilidade com registros/telas
       que ainda utilizem equipeFixa/equipeRotativa.
    ===================================================== */

    const {
      viatura,
      equipeFixa
    } = req.body;

    const equipeRotativa = {
      motorista:
        Array.isArray(
          req.body
            .equipeRotativa
            ?.motorista
        )
          ? req.body
              .equipeRotativa
              .motorista
          : [],

      quarto:
        Array.isArray(
          req.body
            .equipeRotativa
            ?.quarto
        )
          ? req.body
              .equipeRotativa
              .quarto
          : [],

      quinto:
        Array.isArray(
          req.body
            .equipeRotativa
            ?.quinto
        )
          ? req.body
              .equipeRotativa
              .quinto
          : [],

      terceiro:
        []
    };

    if (!viatura) {
      return res
        .status(400)
        .json({
          message:
            "Viatura é obrigatória"
        });
    }

    if (
      !equipeFixa ||
      !equipeFixa.chefe ||
      !equipeFixa.auxiliar ||
      Number(
        equipeFixa.chefe
          .funcional
      ) <= 0 ||
      Number(
        equipeFixa.auxiliar
          .funcional
      ) <= 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "Chefe e Auxiliar são obrigatórios na abertura do RSO antigo"
        });
    }

    if (
      !Array.isArray(
        equipeRotativa
          .motorista
      ) ||
      !equipeRotativa
        .motorista[0]
        ?.funcional
    ) {
      return res
        .status(400)
        .json({
          message:
            "Motorista é obrigatório na abertura do RSO antigo"
        });
    }

    const buscarLegado =
      async (
        funcional,
        cargo
      ) => {
        return buscarPolicialHierarquia(
          funcional,
          "VIATURA",
          cargo
        );
      };

    const rso =
      await RSO.create({
        tipoPatrulhamento:
          "VIATURA",

        viatura,

        equipe:
          [],

        equipeFixa: {
          chefe:
            await buscarLegado(
              equipeFixa
                .chefe
                .funcional,
              "Chefe"
            ),

          auxiliar:
            await buscarLegado(
              equipeFixa
                .auxiliar
                .funcional,
              "Auxiliar"
            )
        },

        equipeRotativa: {
          motorista:
            await Promise.all(
              equipeRotativa
                .motorista
                .map((p) =>
                  buscarLegado(
                    p.funcional,
                    "Motorista"
                  )
                )
            ),

          quarto:
            await Promise.all(
              equipeRotativa
                .quarto
                .map((p) =>
                  buscarLegado(
                    p.funcional,
                    "4º Homem"
                  )
                )
            ),

          quinto:
            await Promise.all(
              equipeRotativa
                .quinto
                .map((p) =>
                  buscarLegado(
                    p.funcional,
                    "5º Homem"
                  )
                )
            ),

          terceiro:
            []
        },

        observacoes:
          "",

        apreensoes:
          [],

        criadoPor:
          req.user.id
      });

    return res
      .status(201)
      .json(rso);
  } catch (e) {
    console.error(
      "Erro ao abrir RSO:",
      e
    );

    if (e.extra) {
      return res
        .status(
          e.statusCode ||
          400
        )
        .json({
          message:
            e.message,

          ...e.extra
        });
    }

    return res
      .status(400)
      .json({
        message:
          e.message ||
          "Erro ao abrir RSO"
      });
  }
};

/* =========================================================
   ADICIONAR POLICIAL
========================================================= */

exports.adicionarPolicial =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        funcional,
        cargo
      } = req.body;

      const rso =
        await RSO.findById(
          id
        );

      if (
        !rso ||
        rso.status !==
          "Ativo"
      ) {
        return res
          .status(400)
          .json({
            message:
              "RSO inválido"
          });
      }

      /* =====================================================
         VERIFICA SE POLICIAL JÁ ESTÁ EM OUTRO RSO ATIVO
      ===================================================== */

      if (
        await policialEmRSOAtivo(
          funcional
        )
      ) {
        const conflito =
          await montarMensagemConflito(
            funcional,
            cargo ||
              "Policial"
          );

        return res
          .status(400)
          .json({
            message:
              conflito.message,

            rsoConflitante:
              conflito.rsoConflitante,

            policialConflitante:
              conflito.policialConflitante
          });
      }

      /* =====================================================
         NOVA EQUIPE DINÂMICA
      ===================================================== */

      if (
        Array.isArray(
          rso.equipe
        ) &&
        (
          rso.equipe.length >
            0 ||
          rso.tipoPatrulhamento ===
            "ROCAM"
        )
      ) {
        const tipo =
          normalizarTipoPatrulhamento(
            rso.tipoPatrulhamento
          );

        const integrante =
          await buscarPolicialHierarquia(
            funcional,
            tipo,
            cargo
          );

        /* =================================================
           ROCAM

           Pode adicionar:
           - Encarregado
           - Operador

           Só pode existir 1 Encarregado ATIVO.

           Se o Encarregado anterior já tiver sido
           encerrado, outro poderá assumir.
        ================================================= */

        if (
          tipo ===
          "ROCAM"
        ) {
          const cargoNovo =
            normalizarCargo(
              cargo
            );

          if (
            ![
              "Encarregado",
              "Operador"
            ].includes(
              cargoNovo
            )
          ) {
            return res
              .status(400)
              .json({
                message:
                  "Na ROCAM o integrante deve ser Encarregado ou Operador."
              });
          }

          if (
            cargoNovo ===
            "Encarregado"
          ) {
            const existeEncarregadoAtivo =
              (rso.equipe || [])
                .some(
                  (p) =>
                    normalizarCargo(
                      p?.cargo
                    ) ===
                      "Encarregado" &&
                    p?.status ===
                      "Ativo"
                );

            if (
              existeEncarregadoAtivo
            ) {
              return res
                .status(400)
                .json({
                  message:
                    "Já existe um Encarregado ativo neste RSO ROCAM."
                });
            }
          }

          integrante.cargo =
            cargoNovo;
        }

        rso.equipe.push(
          integrante
        );

        await rso.save();

        return res.json(
          rso
        );
      }

      /* =====================================================
         COMPATIBILIDADE COM RSO ANTIGO
      ===================================================== */

      const h =
        await Hierarchy.findOne({
          funcional:
            Number(funcional),

          status:
            "Ativo"
        });

      if (!h) {
        return res
          .status(400)
          .json({
            message:
              "Policial inválido"
          });
      }

      const cargoLegado =
        String(
          cargo ||
          "terceiro"
        );

      if (
        !Array.isArray(
          rso.equipeRotativa[
            cargoLegado
          ]
        )
      ) {
        rso.equipeRotativa[
          cargoLegado
        ] = [];
      }

      rso.equipeRotativa[
        cargoLegado
      ].push({
        funcional:
          h.funcional,

        nome:
          h.nome,

        patente:
          h.patente,

        cargo:
          cargoLegado,

        qualificacaoRocam:
          h.qualificacaoRocam ||
          "NENHUM",

        horaEntrada:
          new Date(),

        horaSaida:
          null,

        status:
          "Ativo",

        tempoMinutos:
          0
      });

      await rso.save();

      return res.json(rso);
    } catch (error) {
      console.error(
        "Erro ao adicionar policial:",
        error
      );

      if (error.extra) {
        return res
          .status(
            error.statusCode ||
            400
          )
          .json({
            message:
              error.message,

            ...error.extra
          });
      }

      return res
        .status(400)
        .json({
          message:
            error.message ||
            "Erro ao adicionar policial"
        });
    }
  };

/* =========================================================
   ADICIONAR APREENSÃO
========================================================= */

exports.adicionarApreensao =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        tipo,
        quantidade
      } = req.body;

      const rso =
        await RSO.findById(
          id
        );

      if (
        !rso ||
        rso.status !==
          "Ativo"
      ) {
        return res
          .status(400)
          .json({
            message:
              "RSO inválido"
          });
      }

      rso.apreensoes.push({
        tipo,
        quantidade
      });

      await rso.save();

      return res.json(rso);
    } catch (error) {
      console.error(
        "Erro ao adicionar apreensão:",
        error
      );

      return res
        .status(400)
        .json({
          message:
            error.message ||
            "Erro ao adicionar apreensão"
        });
    }
  };

/* =========================================================
   ATUALIZAR OBSERVAÇÕES
========================================================= */

exports.atualizarObservacoesAtivo =
  async (req, res) => {
    const { id } =
      req.params;

    const {
      observacoes
    } = req.body;

    const rso =
      await RSO.findById(
        id
      );

    if (!rso) {
      return res
        .status(404)
        .json({
          message:
            "RSO não encontrado"
        });
    }

    if (
      rso.status !==
      "Ativo"
    ) {
      return res
        .status(400)
        .json({
          message:
            "Observações só podem ser alteradas com RSO ativo"
        });
    }

    rso.observacoes =
      observacoes || "";

    await rso.save();

    return res.json(rso);
  };

/* =========================================================
   ENCERRAR POLICIAL
========================================================= */

exports.encerrarPolicial =
  async (req, res) => {
    try {
      const {
        id,
        cargo,
        index
      } = req.params;

      const rso =
        await RSO.findById(
          id
        );

      if (!rso) {
        return res
          .status(404)
          .json({
            message:
              "RSO não encontrado"
          });
      }

      if (
        rso.status !==
        "Ativo"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Somente integrantes de RSO ativo podem ser encerrados"
          });
      }

      let p = null;

      /* =====================================================
         NOVO MODELO
      ===================================================== */

      if (
        cargo ===
        "equipe"
      ) {
        p =
          rso.equipe?.[
            Number(index)
          ];
      }

      /* =====================================================
         MODELO ANTIGO - EQUIPE ROTATIVA
      ===================================================== */

      if (
        !p &&
        Array.isArray(
          rso
            .equipeRotativa
            ?.[cargo]
        )
      ) {
        p =
          rso
            .equipeRotativa[
              cargo
            ][
              Number(index)
            ];
      }

      /* =====================================================
         MODELO ANTIGO - EQUIPE FIXA
      ===================================================== */

      if (
        !p &&
        (
          cargo ===
            "chefe" ||
          cargo ===
            "auxiliar"
        )
      ) {
        p =
          rso.equipeFixa?.[
            cargo
          ];
      }

      if (!p) {
        return res
          .status(404)
          .json({
            message:
              "Integrante não encontrado"
          });
      }

      if (
        p.status ===
        "Encerrado"
      ) {
        return res.json({
          message:
            "Integrante já estava encerrado"
        });
      }

      p.horaSaida =
        new Date();

      p.tempoMinutos =
        calcularMinutos(
          p.horaEntrada,
          p.horaSaida
        );

      p.status =
        "Encerrado";

      await rso.save();

      return res.json({
        message:
          "Integrante encerrado com sucesso",

        integrante:
          p
      });
    } catch (error) {
      console.error(
        "Erro ao encerrar integrante:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            error.message ||
            "Erro ao encerrar integrante"
        });
    }
  };

/* =========================================================
   ENCERRAR RSO
========================================================= */

exports.encerrarRSO =
  async (req, res) => {
    try {
      const rso =
        await RSO.findById(
          req.params.id
        );

      if (!rso) {
        return res
          .status(404)
          .json({
            message:
              "RSO não encontrado"
          });
      }

      if (
        rso.status !==
        "Ativo"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Somente RSO ativo pode ser encerrado"
          });
      }

      const agora =
        new Date();

      const encerrar =
        (p) => {
          if (
            p &&
            p.status ===
              "Ativo"
          ) {
            p.horaSaida =
              agora;

            p.tempoMinutos =
              calcularMinutos(
                p.horaEntrada,
                agora
              );

            p.status =
              "Encerrado";
          }
        };

      /* =====================================================
         NOVA EQUIPE DINÂMICA
      ===================================================== */

      if (
        Array.isArray(
          rso.equipe
        )
      ) {
        rso.equipe.forEach(
          encerrar
        );
      }

      /* =====================================================
         ESTRUTURA ANTIGA
      ===================================================== */

      encerrar(
        rso.equipeFixa
          ?.chefe
      );

      encerrar(
        rso.equipeFixa
          ?.auxiliar
      );

      Object.values(
        rso.equipeRotativa ||
          {}
      )
        .flat()
        .forEach(encerrar);

      rso.status =
        "Pendente";

      await rso.save();

      return res.json({
        message:
          "RSO encerrado e enviado para aprovação"
      });
    } catch (error) {
      console.error(
        "Erro ao encerrar RSO:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            error.message ||
            "Erro ao encerrar RSO"
        });
    }
  };

/* =========================================================
   EDITAR RSO REJEITADO
========================================================= */

exports.editarRSORejeitado =
  async (req, res) => {
    const { id } =
      req.params;

    const {
      observacoes,
      apreensoes
    } = req.body;

    const rso =
      await RSO.findById(
        id
      );

    if (!rso) {
      return res
        .status(404)
        .json({
          message:
            "RSO não encontrado"
        });
    }

    if (
      rso.status !==
      "Rejeitado"
    ) {
      return res
        .status(400)
        .json({
          message:
            "Somente RSO rejeitado pode ser editado"
        });
    }

    if (
      observacoes !==
      undefined
    ) {
      rso.observacoes =
        observacoes;
    }

    if (
      Array.isArray(
        apreensoes
      )
    ) {
      rso.apreensoes =
        apreensoes;
    }

    await rso.save();

    return res.json(rso);
  };

/* =========================================================
   REENVIAR RSO
========================================================= */

exports.reenviarRSO =
  async (req, res) => {
    const rso =
      await RSO.findById(
        req.params.id
      );

    if (
      !rso ||
      rso.status !==
        "Rejeitado"
    ) {
      return res
        .status(400)
        .json({
          message:
            "RSO inválido"
        });
    }

    rso.status =
      "Pendente";

    rso.comentarioADM =
      "";

    await rso.save();

    return res.json({
      message:
        "RSO reenviado para aprovação"
    });
  };

/* =========================================================
   EXCLUIR MEU RSO
========================================================= */

exports.excluirMeuRSO =
  async (req, res) => {
    const rso =
      await RSO.findById(
        req.params.id
      );

    if (
      !rso ||
      [
        "Ativo",
        "Pendente"
      ].includes(
        rso.status
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Não pode excluir este RSO"
        });
    }

    await rso.deleteOne();

    return res.json({
      message:
        "RSO excluído"
    });
  };

/* =========================================================
   ATUALIZAR OBSERVAÇÕES
   ROTA UTILIZADA PELO FRONTEND ATUAL
========================================================= */

exports.atualizarObservacoes =
  async (req, res) => {
    const { id } =
      req.params;

    const {
      observacoes
    } = req.body;

    const rso =
      await RSO.findById(
        id
      );

    if (!rso) {
      return res
        .status(404)
        .json({
          message:
            "RSO não encontrado"
        });
    }

    if (
      rso.status !==
      "Ativo"
    ) {
      return res
        .status(400)
        .json({
          message:
            "Observações só podem ser alteradas com RSO ativo"
        });
    }

    rso.observacoes =
      observacoes || "";

    await rso.save();

    return res.json({
      message:
        "Observações atualizadas"
    });
  };