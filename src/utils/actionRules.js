const ACTION_RULES = [
  {
    codigo: "LOJINHAS",
    nome: "Lojinhas",
    icone: "🏪",
    categoria: "PEQUENO_PORTE",
    maxBandidos: 3,
    maxPoliciais: 4,
    armamentoPermitido: "Apenas pistola",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "Permitido 1 bandido do lado de fora dentro da área vermelha",
      "Proibido o uso de glock rajada nesta ação"
    ],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Não é permitido que os bandidos fiquem disparando antes do início",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "AMMUNATION",
    nome: "Ammunation",
    icone: "🔫",
    categoria: "PEQUENO_PORTE",
    maxBandidos: 2,
    maxPoliciais: 3,
    armamentoPermitido: "Apenas pistola",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "Proibido ter bandido fora do estabelecimento",
      "Proibido o uso de glock rajada nesta ação"
    ],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Não é permitido que os bandidos fiquem disparando antes do início",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "CENTRAL_DE_DADOS",
    nome: "Central de Dados",
    icone: "💾",
    categoria: "MEDIO_PORTE",
    maxBandidos: 6,
    maxPoliciais: 8,
    armamentoPermitido: "Apenas pistola",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: ["Proibido o uso de glock rajada nesta ação"],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Não é permitido que os bandidos fiquem disparando antes do início",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "MADEREIRA",
    nome: "Madereira",
    icone: "🪵",
    categoria: "MEDIO_PORTE",
    maxBandidos: 6,
    maxPoliciais: 8,
    armamentoPermitido: "Apenas pistola",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "Proibido subir em prédios e objetos",
      "Proibido o uso de glock rajada nesta ação"
    ],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Não é permitido que os bandidos fiquem disparando antes do início",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "BANCO_FLEECA",
    nome: "Banco Fleeca",
    icone: "🏦",
    categoria: "MEDIO_PORTE",
    maxBandidos: 6,
    maxPoliciais: 8,
    armamentoPermitido: "Apenas arma de alto calibre e SMG",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: ["Permitido somente 2 bandidos do lado de fora"],
    regras: [
      "Em caso de troca é necessária negociação prévia",
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "GALINHEIRO",
    nome: "Galinheiro",
    icone: "🐔",
    categoria: "MEDIO_PORTE",
    maxBandidos: 8,
    maxPoliciais: 10,
    armamentoPermitido: "Apenas pistola",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "Não será permitido abusar de bugs",
      "Proibido o uso de glock rajada nesta ação"
    ],
    regras: [
      "Em caso de troca é necessária negociação prévia",
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "JOALHERIA",
    nome: "Joalheria",
    icone: "💎",
    categoria: "MEDIO_PORTE",
    maxBandidos: 6,
    maxPoliciais: 8,
    armamentoPermitido: "Apenas arma de alto calibre e SMG",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "Permitido somente 1 bandido do lado de fora",
      "É proibido utilizar o interior da Prefeitura",
      "Proibido o uso de glock rajada nesta ação"
    ],
    regras: [
      "Em caso de troca é necessária negociação prévia",
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "CASA_MAL_ASSOMBRADA",
    nome: "Casa Mal Assombrada",
    icone: "👻",
    categoria: "MEDIO_PORTE",
    maxBandidos: 8,
    maxPoliciais: 10,
    armamentoPermitido: "Apenas pistola",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "É permitido teto e chão",
      "Proibido o uso de glock rajada nesta ação"
    ],
    regras: [
      "Em caso de troca é necessária negociação prévia",
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "ACOUGUE",
    nome: "Açougue",
    icone: "🥩",
    categoria: "MEDIO_PORTE",
    maxBandidos: 8,
    maxPoliciais: 10,
    armamentoPermitido: "Apenas pistola",
    negociacaoObrigatoria: true,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "Não será permitido abusar de bugs",
      "Proibido o uso de glock rajada nesta ação"
    ],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Não é permitido que os bandidos fiquem disparando antes do início",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "YATCH",
    nome: "Yatch",
    icone: "🛥️",
    categoria: "MEDIO_PORTE",
    maxBandidos: 6,
    maxPoliciais: 8,
    armamentoPermitido: "Apenas pistola",
    negociacaoObrigatoria: false,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "Não existe negociação, após o FF liberado a ação inicia",
      "Proibido marcar entradas como portas e escadas",
      "Proibido o uso de glock rajada nesta ação"
    ],
    regras: [
      "Não será permitido abusar de bugs",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "BANCO_PALETO",
    nome: "Banco de Paleto",
    icone: "🏦",
    categoria: "GRANDE_PORTE",
    maxBandidos: 10,
    maxPoliciais: 12,
    armamentoPermitido: "Apenas fuzil",
    negociacaoObrigatoria: true,
    permiteRefem: true,
    limiteRefens: 1,
    observacoes: ["Permitido somente 2 bandidos do lado de fora"],
    regras: [
      "Em caso de troca é necessária negociação prévia",
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "BANCO_CENTRAL",
    nome: "Banco Central",
    icone: "🏛️",
    categoria: "GRANDE_PORTE",
    maxBandidos: 10,
    maxPoliciais: 12,
    armamentoPermitido: "Apenas arma de alto calibre",
    negociacaoObrigatoria: true,
    permiteRefem: true,
    limiteRefens: 2,
    observacoes: [
      "Permitido até 3 bandidos do lado de fora",
      "Não será permitido abusar de bugs"
    ],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "NIOBIO",
    nome: "Nióbio",
    icone: "🧪",
    categoria: "GRANDE_PORTE",
    maxBandidos: 12,
    maxPoliciais: 15,
    armamentoPermitido: "Apenas arma de alto calibre",
    negociacaoObrigatoria: true,
    permiteRefem: true,
    limiteRefens: 3,
    observacoes: [
      "É proibido marcar a escada da água, saída e blip do elevador da P2"
    ],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "FACULDADE",
    nome: "Faculdade",
    icone: "👨🏽‍🏫",
    categoria: "GRANDE_PORTE",
    maxBandidos: 8,
    maxPoliciais: 10,
    armamentoPermitido: "Apenas arma de alto calibre",
    negociacaoObrigatoria: true,
    permiteRefem: true,
    limiteRefens: 3,
    observacoes: ["Somente chão, proibido ficar em locais acima do chão"],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "ESTUDIO_DE_CINEMA",
    nome: "Estúdio de Cinema",
    icone: "🎥",
    categoria: "GRANDE_PORTE",
    maxBandidos: 10,
    maxPoliciais: 13,
    armamentoPermitido: "Apenas arma de alto calibre",
    negociacaoObrigatoria: true,
    permiteRefem: true,
    limiteRefens: 3,
    observacoes: ["Somente chão, proibido ficar em locais acima do chão"],
    regras: [
      "Não é permitido que os policiais cheguem atirando",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "PORTA_AVIOES",
    nome: "Porta Aviões",
    icone: "🚨",
    categoria: "GRANDE_PORTE",
    maxBandidos: 15,
    maxPoliciais: 12,
    armamentoPermitido: "Apenas arma de alto calibre",
    negociacaoObrigatoria: false,
    permiteRefem: false,
    limiteRefens: 0,
    observacoes: [
      "Ação invertida",
      "A polícia precisa estar dentro do porta aviões",
      "É proibido marcar as entradas",
      "A ação ocorre 100% no interior do porta aviões"
    ],
    regras: [
      "Não tem negociação, após o sistema liberar o FF a ação inicia",
      "Permitido uso de utilitários"
    ]
  },
  {
    codigo: "OUTROS",
    nome: "Outros",
    icone: "➕",
    categoria: "DIVERSOS",
    maxBandidos: "-",
    maxPoliciais: "-",
    armamentoPermitido: "Variável conforme situação",
    negociacaoObrigatoria: false,
    permiteRefem: false,
    limiteRefens: 0,
    regras: [
      "Utilize esta opção para registrar ações, eventos, apoios operacionais ou ocorrências que não estejam previstas na lista padrão.",
      "O registro será analisado pela administração antes de entrar na contabilidade da meta.",
      "Informe nas observações todos os detalhes necessários para validação."
    ],
    observacoes: [
      "O administrador poderá manter a ação apenas no histórico ou permitir que ela conte para a meta."
    ]
  }
];

function getActionRuleByCode(code) {
  return ACTION_RULES.find((item) => item.codigo === code) || null;
}

module.exports = {
  ACTION_RULES,
  getActionRuleByCode
};