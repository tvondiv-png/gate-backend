/* =========================================================
   GERADOR DE TEXTO DO BOLETIM DE OCORRÊNCIA (BOPM)

   Recebe só as respostas básicas do policial e monta o texto
   completo seguindo a estrutura do Art. 17.2 do Regulamento
   Interno (Viatura, Natureza dos fatos, Local, Relato, Dados
   do suspeito, Veículo do suspeito, Ilícitos encontrados).

   Não usa nenhuma IA/API externa — é composição de texto por
   modelo (templates), 100% determinística e gratuita.
========================================================= */

const CIDADE_FIXA = "Brasil Capital";

const LABEL_TIPO_ABORDAGEM = {
  FUNDADA_SUSPEITA: "fundada suspeita de porte de item ilícito",
  FLAGRANTE: "flagrante delito",
  DENUNCIA: "denúncia recebida via central de operações",
  ABORDAGEM_PADRAO: "abordagem de rotina durante patrulhamento"
};

const LABEL_RESULTADO = {
  PRESO: "preso em flagrante e conduzido à unidade de custódia",
  LIBERADO:
    "liberado no local, não sendo constatada irregularidade que justificasse a detenção",
  CONDUZIDO_DELEGACIA:
    "conduzido à Delegacia de Polícia Civil para os procedimentos cabíveis",
  HOSPITAL_PRESO:
    "encaminhado à unidade hospitalar para atendimento médico e, na sequência, preso e conduzido à unidade de custódia",
  HOSPITAL_LIBERADO:
    "encaminhado à unidade hospitalar para atendimento médico e, após avaliação, liberado",
  OBITO_IML:
    "alvejado durante a ocorrência, vindo a óbito no local, sendo o corpo conduzido ao IML"
};

const LABEL_PROCEDIMENTO = {
  BUSCA_PESSOAL: "busca pessoal",
  BUSCA_VEICULAR: "busca veicular",
  USO_FORCA: "uso de força moderada para contenção",
  APOIO_VTR: "apoio de viatura de reforço"
};

/* =========================================================
   FORMATA UM ITEM ILÍCITO (§7º do Art. 17.2)
========================================================= */

function formatarIlicito(item) {
  if (item.tipo === "Valores") {
    return `Valores: R$ ${item.quantidade || "0,00"} em notas marcadas`;
  }

  if (item.tipo === "Armas") {
    const modelo = item.subtipo ? ` (${item.subtipo})` : "";
    const serial = item.serial ? ` — nº de série: ${item.serial}` : "";
    return `Armas${modelo}: ${item.quantidade || "1"}${serial}${
      item.descricao ? ` — ${item.descricao}` : ""
    }`;
  }

  if (item.tipo === "Munições") {
    return `Munições${item.subtipo ? ` (${item.subtipo})` : ""}: ${
      item.quantidade || "-"
    }${item.descricao ? ` — ${item.descricao}` : ""}`;
  }

  if (item.tipo === "Entorpecentes") {
    const substancia = item.subtipo || "não especificado";
    return `Entorpecentes (${substancia}): ${item.quantidade || "-"}${
      item.descricao ? ` — ${item.descricao}` : ""
    }`;
  }

  // Ilicitos (capuz, algema, lockpick, bomba caseira, outros)
  const item_ = item.subtipo || item.descricao || "item ilícito";
  return `Ilícitos (${item_}): ${item.quantidade || "-"}`;
}

/* =========================================================
   COMPÕE O RELATO (§4º do Art. 17.2)
========================================================= */

function gerarRelato({ viatura, abordagem, ilicitos }) {
  const tipoTexto =
    LABEL_TIPO_ABORDAGEM[abordagem.tipo] ||
    "abordagem realizada durante patrulhamento";

  const resultadoTexto =
    LABEL_RESULTADO[abordagem.resultado] || "encaminhado conforme procedimento";

  const procedimentosTexto = (abordagem.procedimentos || [])
    .map((p) => LABEL_PROCEDIMENTO[p] || p)
    .filter(Boolean);

  const ilicitosTexto =
    ilicitos && ilicitos.length > 0
      ? "Na ocasião, foram encontrados os itens ilícitos descritos na seção própria deste boletim"
      : "Não foram encontrados itens ilícitos com o suspeito";

  const partes = [
    `Durante patrulhamento pela região, a equipe da viatura ${viatura} deparou-se com o suspeito em situação de ${tipoTexto}, sendo dada ordem de abordagem por ${abordagem.ordemDadaPor}.`
  ];

  if (procedimentosTexto.length > 0) {
    partes.push(
      `Foi realizada ${procedimentosTexto.join(", ")}, conforme os procedimentos operacionais padrão.`
    );
  }

  partes.push(`${ilicitosTexto}.`);
  partes.push(`Diante dos fatos apresentados, o suspeito foi ${resultadoTexto}.`);

  return partes.join(" ");
}

/* =========================================================
   COMPÕE O TEXTO COMPLETO DO BOLETIM
========================================================= */

function formatarLocal(local) {
  if (!local?.rua) return "Não informado.";

  const cia = local.cia
    ? `\nCompanhia responsável: ${local.cia}`
    : "";

  return `${local.rua}, ${local.bairro}, ${CIDADE_FIXA}.${cia}`;
}

function gerarTextoCompleto(dados) {
  const {
    viatura,
    equipe = [],
    naturezaFatos = [],
    localAbordagem,
    localFinalizacao,
    relatoTexto,
    suspeito,
    veiculoSuspeito,
    ilicitos = []
  } = dados;

  const linhasEquipe = equipe.length
    ? equipe
        .map(
          (i) =>
            `- ${i.patente ? `${i.patente} ` : ""}${i.nome}${
              i.funcao ? ` (${i.funcao})` : ""
            }`
        )
        .join("\n")
    : "- Não informado";

  const linhasNatureza = naturezaFatos.length
    ? naturezaFatos.map((a) => `- ${a.artigo} — ${a.titulo}`).join("\n")
    : "- Não informado";

  const linhasIlicitos = ilicitos.length
    ? ilicitos.map((i) => `- ${formatarIlicito(i)}`).join("\n")
    : "Nenhum item ilícito apreendido.";

  const houveFinalizacaoDiferente =
    localFinalizacao &&
    localFinalizacao.rua &&
    (localFinalizacao.rua !== localAbordagem?.rua ||
      localFinalizacao.bairro !== localAbordagem?.bairro);

  const blocoLocal = houveFinalizacaoDiferente
    ? `LOCAL DA ABORDAGEM:
${formatarLocal(localAbordagem)}

LOCAL DE FINALIZAÇÃO DA OCORRÊNCIA:
${formatarLocal(localFinalizacao)}`
    : `LOCAL:
${formatarLocal(localAbordagem)}`;

  const veiculoTexto = veiculoSuspeito?.possui
    ? `${veiculoSuspeito.marca} ${veiculoSuspeito.modelo}, cor ${veiculoSuspeito.cor}, placa ${veiculoSuspeito.placa}.`
    : "Não foi localizado veículo relacionado ao suspeito.";

  return `BOLETIM DE OCORRÊNCIA POLICIAL MILITAR
2º Batalhão de Polícia de Choque — ${CIDADE_FIXA}

VIATURA: ${viatura}

EQUIPE:
${linhasEquipe}

NATUREZA DOS FATOS:
${linhasNatureza}

${blocoLocal}

RELATO:
${relatoTexto}

DADOS DO SUSPEITO:
Nome: ${suspeito?.nome || "Não identificado"}
RG: ${suspeito?.rg || "não informado"}
Vestimenta no momento da abordagem: ${suspeito?.vestimenta || "não informada"}.
Cor de pele: ${suspeito?.corPele || "-"}
Cabelo: ${suspeito?.cabelo || "-"}

VEÍCULO DO SUSPEITO:
${veiculoTexto}

ILÍCITOS ENCONTRADOS:
${linhasIlicitos}`;
}

module.exports = {
  gerarRelato,
  gerarTextoCompleto,
  CIDADE_FIXA,
  LABEL_TIPO_ABORDAGEM,
  LABEL_RESULTADO,
  LABEL_PROCEDIMENTO
};
