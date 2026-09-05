const DISCIPLINARY_RULES = [
  {
    codigo: "RD-RESPEITO-I",
    secao: "Respeito e Postura",
    item: "I",
    titulo: "Faltar com respeito para com qualquer policial militar e superior estando de serviço, ou não",
    gravidade: "MEDIA"
  },
  {
    codigo: "RD-RESPEITO-II",
    secao: "Respeito e Postura",
    item: "II",
    titulo: "Faltar com respeito para com qualquer civil durante o serviço sendo em abordagem ou condução",
    gravidade: "MEDIA"
  },
  {
    codigo: "RD-RESPEITO-III",
    secao: "Respeito e Postura",
    item: "III",
    titulo: "Proferir palavras ofensivas, preconceituosas e vexatórias em serviço, ou fardado",
    gravidade: "GRAVE"
  },
  {
    codigo: "RD-MORAL-I",
    secao: "Moral",
    item: "I",
    titulo: "Ligar-se ou integrar-se com organização criminosa ou grupo específico",
    gravidade: "GRAVISSIMA"
  },
  {
    codigo: "RD-MORAL-II",
    secao: "Moral",
    item: "II",
    titulo: "Apropriar-se de objetos apreendidos e ilícitos encontrados",
    gravidade: "GRAVE"
  },
  {
    codigo: "RD-MORAL-III",
    secao: "Moral",
    item: "III",
    titulo: "Entregar, permitir e facilitar a posse de ilícitos para terceiros",
    gravidade: "GRAVISSIMA"
  },
  {
    codigo: "RD-DIGNIDADE-I",
    secao: "Dignidade",
    item: "I",
    titulo: "Utilizar da função pública para obter vantagem ou acesso",
    gravidade: "GRAVE"
  },
  {
    codigo: "RD-DIGNIDADE-II",
    secao: "Dignidade",
    item: "II",
    titulo: "Cometer crimes previstos no código penal",
    gravidade: "GRAVISSIMA"
  },
  {
    codigo: "RD-HIERARQUIA-I",
    secao: "Hierarquia",
    item: "I",
    titulo: "Não acatar as legais ordens emanadas do seu superior hierárquico",
    gravidade: "GRAVE"
  },
  {
    codigo: "RD-HIERARQUIA-II",
    secao: "Hierarquia",
    item: "II",
    titulo: "Causar desconforto ou constrangimento a subordinado pelo uso da patente ou função",
    gravidade: "MEDIA"
  },
  {
    codigo: "RD-ETICA-I",
    secao: "Ética",
    item: "I",
    titulo: "Usar de informações privilegiadas para causar atritos e problemas internos e externos",
    gravidade: "GRAVE"
  },
  {
    codigo: "RD-ETICA-V",
    secao: "Ética",
    item: "V",
    titulo: "Tornar público conteúdo, documento ou processo que deveria correr em ato confidencial",
    gravidade: "GRAVE"
  },
  {
    codigo: "RD-VERDADE-I",
    secao: "Verdade",
    item: "I",
    titulo: "Utilizar de mentiras para excluir-se de processo ou abstenção de culpa",
    gravidade: "GRAVE"
  },
  {
    codigo: "RD-VERDADE-V",
    secao: "Verdade",
    item: "V",
    titulo: "Utilizar de falsidade ideológica dentro e fora da cidade para benefício próprio ou de outro",
    gravidade: "GRAVISSIMA"
  },
  {
    codigo: "RD-REGRAS-I",
    secao: "Regras Específicas",
    item: "I",
    titulo: "Descumprir quaisquer regras impostas pela prefeitura",
    gravidade: "MEDIA"
  },
  {
    codigo: "RD-REGRAS-II",
    secao: "Regras Específicas",
    item: "II",
    titulo: "Utilizar equipamentos, fardamentos, veículos e materiais bélicos não permitidos",
    gravidade: "GRAVE"
  }
];

const DISCIPLINARY_ATTENUANTS = [
  "Bom comportamento",
  "Relevância de serviços prestados",
  "Ter sido cometida a transgressão para evitar mal maior",
  "Defesa própria, de seus direitos ou de outrem",
  "Falta de prática do serviço"
];

const DISCIPLINARY_AGGRAVANTS = [
  "Mau comportamento",
  "Prática simultânea ou conexão de duas ou mais transgressões",
  "Reincidência",
  "Conluio de duas ou mais pessoas",
  "Abuso de autoridade hierárquica ou funcional",
  "Durante a execução do serviço",
  "Em presença de subordinado",
  "Com premeditação",
  "Em presença de público"
];

module.exports = {
  DISCIPLINARY_RULES,
  DISCIPLINARY_ATTENUANTS,
  DISCIPLINARY_AGGRAVANTS
};