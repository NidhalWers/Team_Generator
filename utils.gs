function getJoueurs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Joueurs");
  const data = sheet.getDataRange().getValues();

  let joueurs = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1]) {
      joueurs.push({
        index: i,
        nom: data[i][1]
      });
    }
  }

  return joueurs;
}

function readPlayers(selectedIndexes, data){
  const joueurs = [];

  // Lecture joueurs présents (à partir ligne 2)
  for (let i = 1; i < data.length; i++) {

    const nom = data[i][1];

    // On utilise uniquement la sélection WebApp
    if (selectedIndexes.includes(i)) {
      joueurs.push({
        name: data[i][1],
        note: data[i][2],
        postes: [data[i][3], data[i][4], data[i][5], data[i][6]]
      });
    }
  }

  return joueurs;
}

function getStandardDeviation(values) {

  const mean = values.reduce((a,b)=>a+b,0) / values.length;

  const variance = values.reduce((sum,val)=>{
    return sum + Math.pow(val - mean, 2);
  }, 0) / values.length;

  return Math.sqrt(variance);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


