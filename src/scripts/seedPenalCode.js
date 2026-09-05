require("dotenv").config();
const mongoose = require("mongoose");
const PenalCode = require("../models/PenalCode");

const data = [
  {
    artigo: "Art. 218",
    codigo: "218",
    titulo: "Alta Velocidade",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao:
      "Limite de velocidade dentro da cidade de 120 km/h e de veículos de grande porte, 90 km/h.",
    multa: 1500,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["velocidade", "transito", "radar", "alta velocidade"],
    observacoes: [],
    ordem: 1
  },
  {
    artigo: "Art. 175",
    codigo: "175",
    titulo: "Direção Perigosa",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao: "Uso negligente ou imprudente de um veículo.",
    multa: 3000,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["direcao perigosa", "veiculo", "transito"],
    observacoes: [],
    ordem: 2
  },
  {
    artigo: "Art. 181",
    codigo: "181",
    titulo: "Estacionar em local proibido",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao: "Deixar o veículo em local indevido.",
    multa: 2500,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["estacionar", "local proibido", "transito"],
    observacoes: [],
    ordem: 3
  },
  {
    artigo: "Art. 01",
    codigo: "01",
    titulo: "Pousar em local proibido ou sem designação",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao: "Pousar veículos aéreos fora de locais adequados e seguros.",
    multa: 30000,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["aeronave", "pouso", "helicoptero"],
    observacoes: [],
    ordem: 4
  },
  {
    artigo: "Art. 02",
    codigo: "02",
    titulo: "Manobra imprudente com aeronave",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao: "Utilizar aeronave de forma imprudente.",
    multa: 25000,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["aeronave", "manobra", "helicoptero"],
    observacoes: [],
    ordem: 5
  },
  {
    artigo: "Art. 24",
    codigo: "24",
    titulo: "Veículo Abandonado",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao: "Abandonar veículo em local indevido.",
    multa: 1750,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["abandono", "veiculo", "transito"],
    observacoes: [],
    ordem: 6
  },
  {
    artigo: "Art. 186",
    codigo: "186",
    titulo: "Trafegar na contramão",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao: "Conduzir na contramão da via.",
    multa: 2000,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["contramao", "transito", "via"],
    observacoes: [],
    ordem: 7
  },
  {
    artigo: "Art. 225",
    codigo: "225",
    titulo: "Praticar corrida ilegal",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao:
      "Praticar corrida ilegal. Entende-se por corrida ilegal aquela na qual obtém-se dinheiro ilícito, devendo ser aplicada a detenção do veículo e revogação da habilitação.",
    multa: 5000,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["racha", "corrida", "ilegal", "transito"],
    observacoes: ["Pode haver detenção do veículo e revogação da habilitação."],
    ordem: 8
  },
  {
    artigo: "Art. 244-A",
    codigo: "244-A",
    titulo: "Conduzir motocicleta sem usar capacete",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao: "Trafegar com motocicleta sem o uso do capacete.",
    multa: 1750,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["moto", "capacete", "transito"],
    observacoes: [],
    ordem: 9
  },
  {
    artigo: "Art. 230",
    codigo: "230",
    titulo: "Conduzir veículos com taxa atrasada",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao:
      "Conduzir veículo com as taxas atrasadas, podendo ser aplicada a detenção do veículo.",
    multa: 0,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["taxa atrasada", "documentacao", "veiculo"],
    observacoes: ["Valor conforme regulamento."],
    ordem: 10
  },
  {
    artigo: "Art. 245",
    codigo: "245",
    titulo: "Conduzir motocicleta fazendo malabarismo",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao:
      "Conduzir motocicleta fazendo malabarismo ou se equilibrar em apenas uma das rodas.",
    multa: 0,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["moto", "malabarismo", "grau"],
    observacoes: ["Valor conforme regulamento."],
    ordem: 11
  },
  {
    artigo: "Art. 162",
    codigo: "162",
    titulo: "Dirigir sem habilitação",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao:
      "Dirigir sem possuir habilitação, podendo ser aplicada a detenção do veículo.",
    multa: 0,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["habilitacao", "sem cnh", "transito"],
    observacoes: ["Valor conforme regulamento."],
    ordem: 12
  },
  {
    artigo: "Art. 180-A",
    codigo: "180-A",
    titulo: "Falta de combustível em vias",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao: "Ter seu veículo imobilizado na via por falta de combustível.",
    multa: 6780,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["combustivel", "pane seca", "transito"],
    observacoes: [],
    ordem: 13
  },
  {
    artigo: "Art. 244-B",
    codigo: "244-B",
    titulo: "Conduzir motocicleta fazendo malabarismo",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao:
      "Conduzir motocicleta fazendo malabarismo ou se equilibrar em apenas uma das rodas, podendo ser aplicada a revogação da habilitação.",
    multa: 1900,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["moto", "malabarismo", "grau"],
    observacoes: ["Pode haver revogação da habilitação."],
    ordem: 14
  },
  {
    artigo: "Art. 200-B",
    codigo: "200-B",
    titulo: "Roupas Militares",
    tipo: "INFRACAO",
    categoria: "Ordem Pública",
    descricao:
      "Utilizar qualquer acessório ou roupa de cunho militar em locais públicos como Hospital, Mecânicas, Praça e Delegacia.",
    multa: 5000,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["roupa militar", "colete", "coldre"],
    observacoes: [],
    ordem: 15
  },
  {
    artigo: "Art. 200-C",
    codigo: "200-C",
    titulo: "Ocultação facial",
    tipo: "INFRACAO",
    categoria: "Ordem Pública",
    descricao:
      "Utilizar qualquer acessório ou roupa que cubra totalmente o rosto em locais públicos como Hospital, Mecânicas, Praça e Delegacia.",
    multa: 5000,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["mascara", "rosto", "ocultacao facial"],
    observacoes: [],
    ordem: 16
  },
  {
    artigo: "Art. 311",
    codigo: "311",
    titulo: "Clonagem de placas",
    tipo: "INFRACAO",
    categoria: "Trânsito",
    descricao:
      "Adulterar placa de veículo automotor, devendo ser aplicada a detenção do veículo.",
    multa: 5000,
    prisaoMeses: 0,
    semFianca: false,
    palavrasChave: ["placa", "clonagem", "veiculo"],
    observacoes: ["Pode haver detenção do veículo."],
    ordem: 17
  },

  {
    artigo: "Art. 135",
    codigo: "135",
    titulo: "Omissão de Socorro",
    tipo: "CRIME",
    categoria: "Violência",
    descricao:
      "Quando o causador do dano ou lesão ao cidadão abandona o local sem prestar socorro.",
    multa: 4000,
    prisaoMeses: 15,
    semFianca: false,
    palavrasChave: ["omissao", "socorro", "abandono"],
    observacoes: [],
    ordem: 100
  },
  {
    artigo: "Art. 121",
    codigo: "121",
    titulo: "Homicídio",
    tipo: "CRIME",
    categoria: "Violência",
    descricao: "Matar alguém.",
    multa: 0,
    prisaoMeses: 30,
    semFianca: true,
    palavrasChave: ["homicidio", "morte", "assassinato", "matar"],
    observacoes: [],
    ordem: 101
  },
  {
    artigo: "Art. 121-A",
    codigo: "121-A",
    titulo: "Homicídio de funcionário público",
    tipo: "CRIME",
    categoria: "Violência",
    descricao:
      "Matar funcionário público durante a sua função ou em razão dela.",
    multa: 0,
    prisaoMeses: 40,
    semFianca: true,
    palavrasChave: ["funcionario publico", "homicidio", "policial"],
    observacoes: [],
    ordem: 102
  },
  {
    artigo: "Art. 121-B",
    codigo: "121-B",
    titulo: "Homicídio culposo",
    tipo: "CRIME",
    categoria: "Violência",
    descricao:
      "Matar alguém em razão de imprudência, negligência ou imperícia.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: true,
    palavrasChave: ["culposo", "morte", "imprudencia"],
    observacoes: [],
    ordem: 103
  },
  {
    artigo: "Art. 129",
    codigo: "129",
    titulo: "Lesão corporal",
    tipo: "CRIME",
    categoria: "Violência",
    descricao: "Ofender a integridade física ou saúde de outrem.",
    multa: 0,
    prisaoMeses: 15,
    semFianca: false,
    palavrasChave: ["lesao", "agressao", "corporal"],
    observacoes: [],
    ordem: 104
  },
  {
    artigo: "Art. 138",
    codigo: "138",
    titulo: "Calúnia",
    tipo: "CRIME",
    categoria: "Honra",
    descricao: "Imputar fato considerado criminoso a alguém.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["calunia", "acusacao falsa"],
    observacoes: [],
    ordem: 105
  },
  {
    artigo: "Art. 139",
    codigo: "139",
    titulo: "Difamação",
    tipo: "CRIME",
    categoria: "Honra",
    descricao: "Imputar fato ofensivo à reputação de alguém.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["difamacao", "reputacao"],
    observacoes: [],
    ordem: 106
  },
  {
    artigo: "Art. 140",
    codigo: "140",
    titulo: "Injúria",
    tipo: "CRIME",
    categoria: "Honra",
    descricao: "Ofender a dignidade ou decoro de alguém.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["injuria", "ofensa"],
    observacoes: [],
    ordem: 107
  },
  {
    artigo: "Art. 147",
    codigo: "147",
    titulo: "Ameaça",
    tipo: "CRIME",
    categoria: "Violência",
    descricao:
      "Ameaçar alguém, por qualquer meio, a causar mal injusto e grave.",
    multa: 0,
    prisaoMeses: 15,
    semFianca: false,
    palavrasChave: ["ameaca", "intimidacao"],
    observacoes: [],
    ordem: 108
  },
  {
    artigo: "Art. 148",
    codigo: "148",
    titulo: "Sequestro e cárcere privado",
    tipo: "CRIME",
    categoria: "Violência",
    descricao:
      "Privar alguém de sua liberdade, mediante sequestro ou cárcere privado.",
    multa: 0,
    prisaoMeses: 20,
    semFianca: false,
    palavrasChave: ["sequestro", "carcere", "refem"],
    observacoes: [],
    ordem: 109
  },
  {
    artigo: "Art. 150",
    codigo: "150",
    titulo: "Violação de domicílio",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao:
      "Entrar ou permanecer, contra vontade de quem tem direito, em casa ou dependência.",
    multa: 0,
    prisaoMeses: 7,
    semFianca: false,
    palavrasChave: ["domicilio", "invasao", "casa"],
    observacoes: [],
    ordem: 110
  },
  {
    artigo: "Art. 155",
    codigo: "155",
    titulo: "Furto",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao: "Subtrair, para si ou para outrem, coisa alheia móvel.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["furto", "roubo sem violencia"],
    observacoes: [],
    ordem: 111
  },
  {
    artigo: "Art. 157",
    codigo: "157",
    titulo: "Roubo",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao:
      "Subtrair coisa alheia móvel, para si ou outrem, mediante violência ou grave ameaça.",
    multa: 0,
    prisaoMeses: 20,
    semFianca: false,
    palavrasChave: ["roubo", "assalto", "violencia"],
    observacoes: [],
    ordem: 112
  },
  {
    artigo: "Art. 157-B",
    codigo: "157-B",
    titulo: "Roubo seguido de morte (latrocínio)",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao:
      "Subtrair coisa alheia móvel, para si ou outrem, mediante violência ou grave ameaça, com resultado morte.",
    multa: 0,
    prisaoMeses: 60,
    semFianca: true,
    palavrasChave: ["latrocinio", "roubo seguido de morte"],
    observacoes: [],
    ordem: 113
  },
  {
    artigo: "Art. 168",
    codigo: "168",
    titulo: "Apropriação indébita",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao:
      "Apropriar-se de coisa alheia móvel, de que tem posse ou detenção.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["apropriacao indebita"],
    observacoes: [],
    ordem: 114
  },
  {
    artigo: "Art. 171",
    codigo: "171",
    titulo: "Estelionato",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao:
      "Obter, para si ou outrem, vantagem ilícita, em prejuízo alheio, por meio de fraude, erro, artifício ou ardil.",
    multa: 0,
    prisaoMeses: 12,
    semFianca: false,
    palavrasChave: ["estelionato", "fraude", "golpe"],
    observacoes: [],
    ordem: 115
  },
  {
    artigo: "Art. 180",
    codigo: "180",
    titulo: "Receptação",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao:
      "Adquirir, receber, transportar, conduzir ou ocultar, em proveito próprio ou alheio, coisa que saiba ser produto de crime.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["receptacao", "produto de crime"],
    observacoes: [],
    ordem: 116
  },
  {
    artigo: "Art. 121-C",
    codigo: "121-C",
    titulo: "Feminicídio",
    tipo: "CRIME",
    categoria: "Violência",
    descricao:
      "Homicídio doloso praticado contra a mulher por razões da condição de sexo feminino.",
    multa: 0,
    prisaoMeses: 50,
    semFianca: true,
    palavrasChave: ["feminicidio", "mulher", "homicidio"],
    observacoes: [],
    ordem: 117
  },
  {
    artigo: "Art. 200-A",
    codigo: "200-A",
    titulo: "Roupas Policiais",
    tipo: "CRIME",
    categoria: "Administração Pública",
    descricao:
      "Utilizar qualquer acessório ou roupa de uso exclusivamente policial.",
    multa: 0,
    prisaoMeses: 50,
    semFianca: false,
    palavrasChave: ["roupa policial", "farda", "uso indevido"],
    observacoes: [],
    ordem: 118
  },
  {
    artigo: "Art. 201",
    codigo: "201",
    titulo: "Produtos ilícitos",
    tipo: "CRIME",
    categoria: "Ordem Pública",
    descricao: "Portar ou possuir objetos ilícitos, conforme decreto judicial.",
    multa: 0,
    prisaoMeses: 13,
    semFianca: false,
    palavrasChave: ["produtos ilicitos", "objetos ilicitos"],
    observacoes: [],
    ordem: 119
  },
  {
    artigo: "Art. 286",
    codigo: "286",
    titulo: "Incitação e/ou apologia ao crime",
    tipo: "CRIME",
    categoria: "Ordem Pública",
    descricao:
      "Incitar, estimular ou fazer, publicamente, apologia à prática de crimes.",
    multa: 0,
    prisaoMeses: 8,
    semFianca: false,
    palavrasChave: ["apologia", "incitacao", "crime"],
    observacoes: [],
    ordem: 120
  },
  {
    artigo: "Art. 288",
    codigo: "288",
    titulo: "Associação criminosa",
    tipo: "CRIME",
    categoria: "Ordem Pública",
    descricao:
      "Associar-se em 03 ou mais pessoas, para o fim específico de cometer crimes.",
    multa: 0,
    prisaoMeses: 15,
    semFianca: false,
    palavrasChave: ["associacao criminosa", "quadrilha"],
    observacoes: [],
    ordem: 121
  },
  {
    artigo: "Art. 289",
    codigo: "289",
    titulo: "Dinheiro ilícito",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao: "Portar dinheiro marcado.",
    multa: 0,
    prisaoMeses: 18,
    semFianca: false,
    palavrasChave: ["dinheiro ilicito", "dinheiro marcado"],
    observacoes: [],
    ordem: 122
  },
  {
    artigo: "Art. 299",
    codigo: "299",
    titulo: "Falsidade ideológica",
    tipo: "CRIME",
    categoria: "Justiça",
    descricao:
      "Atribuir, para si ou terceiro, falsa identidade, no intuito de obter vantagem ou prejudicar outrem.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["falsa identidade", "falsidade ideologica"],
    observacoes: [],
    ordem: 123
  },
  {
    artigo: "Art. 330",
    codigo: "330",
    titulo: "Desobediência",
    tipo: "CRIME",
    categoria: "Administração Pública",
    descricao: "Desobedecer à ordem legal de funcionário público.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["desobediencia", "ordem legal"],
    observacoes: [],
    ordem: 124
  },
  {
    artigo: "Art. 331",
    codigo: "331",
    titulo: "Desacato",
    tipo: "CRIME",
    categoria: "Administração Pública",
    descricao:
      "Desacatar funcionário público no exercício da função ou em razão dela, com intuito de menosprezá-lo.",
    multa: 0,
    prisaoMeses: 12,
    semFianca: false,
    palavrasChave: ["desacato", "funcionario publico"],
    observacoes: [],
    ordem: 125
  },
  {
    artigo: "Art. 333",
    codigo: "333",
    titulo: "Corrupção",
    tipo: "CRIME",
    categoria: "Administração Pública",
    descricao:
      "Obter, para si ou para outrem, vantagem indevida, em razão da função pública.",
    multa: 0,
    prisaoMeses: 20,
    semFianca: false,
    palavrasChave: ["corrupcao", "vantagem indevida"],
    observacoes: [
      "Parágrafo único: o fato constitui crime, salvo quando não houver violação às regras da cidade."
    ],
    ordem: 126
  },
  {
    artigo: "Art. 333-A",
    codigo: "333-A",
    titulo: "Suborno",
    tipo: "CRIME",
    categoria: "Administração Pública",
    descricao: "Oferecer ou prometer vantagem indevida a funcionário público.",
    multa: 0,
    prisaoMeses: 15,
    semFianca: false,
    palavrasChave: ["suborno", "propina"],
    observacoes: [],
    ordem: 127
  },
  {
    artigo: "Art. 339",
    codigo: "339",
    titulo: "Denunciação caluniosa",
    tipo: "CRIME",
    categoria: "Justiça",
    descricao:
      "Dar causa à instauração de inquérito policial ou processo judicial contra alguém, imputando-lhe crime de que sabe ser inocente.",
    multa: 0,
    prisaoMeses: 12,
    semFianca: false,
    palavrasChave: ["denunciacao caluniosa", "acusacao falsa"],
    observacoes: [],
    ordem: 128
  },
  {
    artigo: "Art. 342",
    codigo: "342",
    titulo: "Falso testemunho",
    tipo: "CRIME",
    categoria: "Justiça",
    descricao:
      "Fazer afirmação falsa, negar ou calar a verdade, na posição de testemunha.",
    multa: 0,
    prisaoMeses: 12,
    semFianca: false,
    palavrasChave: ["falso testemunho", "testemunha"],
    observacoes: [],
    ordem: 129
  },
  {
    artigo: "Art. 351",
    codigo: "351",
    titulo: "Fuga de pessoa custodiada",
    tipo: "CRIME",
    categoria: "Justiça",
    descricao: "Promover ou facilitar fuga de pessoa custodiada.",
    multa: 0,
    prisaoMeses: 12,
    semFianca: false,
    palavrasChave: ["fuga", "custodiada", "preso"],
    observacoes: [],
    ordem: 130
  },
  {
    artigo: "Art. 355",
    codigo: "355",
    titulo: "Abuso de autoridade",
    tipo: "CRIME",
    categoria: "Administração Pública",
    descricao:
      "Abusar da posição pública, no intuito de obter vantagem ou promover injusto a outrem, conforme decreto judicial.",
    multa: 0,
    prisaoMeses: 30,
    semFianca: false,
    palavrasChave: ["abuso de autoridade"],
    observacoes: [],
    ordem: 131
  },
  {
    artigo: "Art. 357",
    codigo: "357",
    titulo: "Obstrução de Justiça",
    tipo: "CRIME",
    categoria: "Justiça",
    descricao:
      "Atrapalhar o andamento de instrução processual ou de ordem judicial.",
    multa: 0,
    prisaoMeses: 12,
    semFianca: false,
    palavrasChave: ["obstrucao", "justica"],
    observacoes: [],
    ordem: 132
  },
  {
    artigo: "Art. 12",
    codigo: "12",
    titulo: "Porte ou posse ilegal de arma classe 1",
    tipo: "CRIME",
    categoria: "Armas e Munições",
    descricao: "Porte ou posse ilegal de armamento semi-automático.",
    multa: 0,
    prisaoMeses: 13,
    semFianca: false,
    palavrasChave: ["arma", "porte", "posse", "classe 1"],
    observacoes: [],
    ordem: 133
  },
  {
    artigo: "Art. 16",
    codigo: "16",
    titulo: "Porte ou posse ilegal de arma classe 2",
    tipo: "CRIME",
    categoria: "Armas e Munições",
    descricao: "Porte ou posse ilegal de armamento automático.",
    multa: 0,
    prisaoMeses: 15,
    semFianca: false,
    palavrasChave: ["arma", "porte", "posse", "classe 2"],
    observacoes: [],
    ordem: 134
  },
  {
    artigo: "Art. 17",
    codigo: "17",
    titulo: "Tráfico de munições",
    tipo: "CRIME",
    categoria: "Armas e Munições",
    descricao:
      "Portar munições, de qualquer calibre, dependerá da comprovação do dolo da comercialização ou traficância para configurar o crime.",
    multa: 0,
    prisaoMeses: 8,
    semFianca: false,
    palavrasChave: ["municao", "trafico de municao"],
    observacoes: [
      "Acima de 10 unidades, já configura o delito, independentemente da finalidade."
    ],
    ordem: 135
  },
  {
    artigo: "Art. 18",
    codigo: "18",
    titulo: "Tráfico de armamento",
    tipo: "CRIME",
    categoria: "Armas e Munições",
    descricao: "Portar mais de 02 armamentos, independente do calibre.",
    multa: 0,
    prisaoMeses: 20,
    semFianca: false,
    palavrasChave: ["trafico de arma", "armamento"],
    observacoes: [],
    ordem: 136
  },
  {
    artigo: "Art. 33",
    codigo: "33",
    titulo: "Tráfico de drogas",
    tipo: "CRIME",
    categoria: "Drogas",
    descricao:
      "Posse ou porte de entorpecentes, permitindo-se o máximo de 04 unidades.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["droga", "trafico", "entorpecente"],
    observacoes: [],
    ordem: 137
  },
  {
    artigo: "Art. 13260",
    codigo: "13260",
    titulo: "Terrorismo",
    tipo: "CRIME",
    categoria: "Ordem Pública",
    descricao:
      "Prática por um ou mais indivíduos de atos por razões de terrorismo contra órgãos públicos com a finalidade de provocar terror social ou generalizado.",
    multa: 0,
    prisaoMeses: 100,
    semFianca: false,
    palavrasChave: ["terrorismo", "terror", "orgao publico"],
    observacoes: [],
    ordem: 138
  },
  {
    artigo: "Art. 215",
    codigo: "215",
    titulo: "Importunação sexual",
    tipo: "CRIME",
    categoria: "Sexual",
    descricao:
      "Praticar contra alguém e sem a sua anuência ato libidinoso com o objetivo de satisfazer a própria lascívia ou a de terceiro.",
    multa: 0,
    prisaoMeses: 40,
    semFianca: false,
    palavrasChave: ["importunacao sexual", "sexual"],
    observacoes: [],
    ordem: 139
  },
  {
    artigo: "Art. 210",
    codigo: "210",
    titulo: "Ultrapassar blitz",
    tipo: "CRIME",
    categoria: "Trânsito",
    descricao: "Transpor, sem autorização, bloqueio viário policial.",
    multa: 3470,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["blitz", "bloqueio", "fuga", "transito"],
    observacoes: [],
    ordem: 140
  },
  {
    artigo: "Art. 126",
    codigo: "126",
    titulo: "Desmonte de veículos",
    tipo: "CRIME",
    categoria: "Patrimônio",
    descricao:
      "Adquirir, receber, transportar, ofertar, conduzir ou ocultar a desmontagem de veículo automotor terrestre.",
    multa: 0,
    prisaoMeses: 10,
    semFianca: false,
    palavrasChave: ["desmonte", "veiculo", "automotor"],
    observacoes: [],
    ordem: 141
  }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo conectado");

    await PenalCode.deleteMany({});
    await PenalCode.insertMany(data);

    console.log(`Código penal seedado com sucesso: ${data.length} registros`);
    process.exit(0);
  } catch (err) {
    console.error("Erro ao seedar código penal:", err);
    process.exit(1);
  }
}

run();