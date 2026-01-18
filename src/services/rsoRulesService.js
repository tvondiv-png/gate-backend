const RSO = require("../models/RSO");

exports.policialEmRSOAtivo = async (funcional) => {
  const rso = await RSO.findOne({
    status: "Ativo",
    $or: [
      {
        "equipeFixa.chefe.funcional": funcional,
        "equipeFixa.chefe.status": "Ativo"
      },
      {
        "equipeFixa.auxiliar.funcional": funcional,
        "equipeFixa.auxiliar.status": "Ativo"
      },
      {
        "equipeRotativa.motorista": {
          $elemMatch: {
            funcional,
            status: "Ativo"
          }
        }
      },
      {
        "equipeRotativa.quarto": {
          $elemMatch: {
            funcional,
            status: "Ativo"
          }
        }
      },
      {
        "equipeRotativa.quinto": {
          $elemMatch: {
            funcional,
            status: "Ativo"
          }
        }
      }
    ]
  });

  return !!rso;
};
