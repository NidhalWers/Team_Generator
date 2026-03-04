function genererEquipes(selectedIndexes) {
  Logger.log("selectedIndexes : " + selectedIndexes);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetJoueurs = ss.getSheetByName("Joueurs");

    
  let sheetEquipes = ss.getSheetByName("Equipes");
  if (sheetEquipes) ss.deleteSheet(sheetEquipes);
  sheetEquipes = ss.insertSheet("Equipes");

  const data = sheetJoueurs.getDataRange().getValues();
  
  const joueurs = readPlayers(selectedIndexes, data);

  const count = joueurs.length;

  if (count < 7) {
    return {
      error: "Pas assez de joueurs sélectionnés"
    };
  }

   // ===== STRUCTURE =====
  const nbEquipesCompletes = Math.floor(count / 7);
  const reste = count % 7;

  let withEquipePartielle = false;
  let nbEquipes = nbEquipesCompletes;
  let nbRemplacants = 0;

  if (reste <= nbEquipesCompletes) {
    nbRemplacants = reste;
  } else {
    withEquipePartielle = true;
    nbEquipes = nbEquipesCompletes + 1;
  }

  Logger.log("nbEquipes : " + nbEquipes + " | nbEquipesCompletes : " + nbEquipesCompletes);
  // =====
  
  // ===== MEDIANE =====
  const notes = joueurs.map(j => j.note).sort((a,b)=>a-b);
  const mid = Math.floor(notes.length / 2);
  const median = notes.length % 2 === 0
    ? (notes[mid-1] + notes[mid]) / 2
    : notes[mid];
  // =====

  const coeffPoste = {
    0: 1.0,   // Poste1
    1: 0.9,   // Poste2
    2: 0.8,   // Poste3
    3: 0.7    // Poste4
  };

  const coeffHorsPoste = 0.6;

  let bestDiff = 999999;
  let bestTeams = null;
  let bestRawAverages = null;
  let bestAdjAverages = null;

  for (let sim = 0; sim < 300; sim++) {

    const poolOfPlayers = getPoolOfPlayers(joueurs, withEquipePartielle);

    const equipes = [];
    const teamScore = new Array(nbEquipes).fill(0);
    const teamRawScore = new Array(nbEquipes).fill(0);
    const teamCount = new Array(nbEquipes).fill(0);

    for (let i = 0; i < nbEquipes; i++) {
      equipes[i] = [];
    }

    const postesRestants = [];
    for (let i = 0; i < nbEquipes; i++) {
      postesRestants[i] = [1,2,1,2,1]; // G DEF MIL AIL BUT
    }

    const totalJoueursARepartir = withEquipePartielle ? nbEquipesCompletes * 7 : poolOfPlayers.length;

    let index = 0;
    // ===== EQUIPES COMPLETES =====
    while (index < totalJoueursARepartir) {

      const player = poolOfPlayers[index];
      const teamIndex = index % nbEquipesCompletes;

      assignPlayerToTeam(
        player,
        teamIndex,
        equipes,
        teamScore,
        teamRawScore,
        teamCount,
        postesRestants,
        coeffPoste,
        coeffHorsPoste
      );

      index++;
    }
    // =====


    // ===== EQUIPE PARTIELLE =====
    if (withEquipePartielle) {
      var lastTeamIndex = nbEquipes - 1;

      while (index < poolOfPlayers.length) {

        const player = poolOfPlayers[index++];

        assignPlayerToTeam(
          player,
          lastTeamIndex,
          equipes,
          teamScore,
          teamRawScore,
          teamCount,
          postesRestants,
          coeffPoste,
          coeffHorsPoste
        );
      }

      // Complétion virtuelle
      while (teamCount[lastTeamIndex] < 7) {
        teamScore[lastTeamIndex] += median;
        teamRawScore[lastTeamIndex] += median;
        teamCount[lastTeamIndex]++;
      }
    }
    // =====

    const averagesScores = teamScore.map((s,i)=> s / teamCount[i]);
    // utiliser un des deux selon les résultats observés
    const stdDev = getStandardDeviation(averagesScores);
    // const stdDev = getStandardDeviation(teamScore);

    if (stdDev < bestDiff) {
      bestDiff = stdDev;
      bestTeams = JSON.parse(JSON.stringify(equipes));

      bestRawAverages = teamRawScore.map((s,i)=> s / teamCount[i]);
      bestAdjAverages = teamScore.map((s,i)=> s / teamCount[i]);
    }
  }

  // Affichage
  sheetEquipes.getRange(1,1).setValue("Equipes optimisées");

  for (let i = 0; i < bestTeams.length; i++) {
    sheetEquipes.getRange(1, i+1).setValue("Equipe " + (i+1));
    for (let r = 0; r < bestTeams[i].length; r++) {
      sheetEquipes.getRange(r+2, i+1).setValue(bestTeams[i][r]);
    }
  }

  // SpreadsheetApp.getUi().alert("Equipes générées !");
  Logger.log("best teams :" + bestTeams);
  Logger.log("best raw average :" + bestRawAverages);
  Logger.log("best adj average :" + bestAdjAverages);
  return {
    teams: bestTeams,
    rawAvg: bestRawAverages,
    adjAvg: bestAdjAverages
  };
}

function assignPlayerToTeam(
  player,
  teamIndex,
  equipes,
  teamScore,
  teamRawScore,
  teamCount,
  postesRestants,
  coeffPoste,
  coeffHorsPoste
) {

  let noteAdj = player.note * coeffHorsPoste;
  let posteChoisi = "Hors poste";

  if (teamCount[teamIndex] < 7) {

    for (let posteCol = 0; posteCol < 4; posteCol++) {

      // on s'arrête si le joueur n'a plus de poste jouable
      if (!player.postes[posteCol]) continue;

      const postesPossibles = player.postes[posteCol]
        .toString()
        .split(",")
        .map(p => p.trim());

      for (let postePossible of postesPossibles) {

        const posteIndex = getPosteIndex(postePossible);

        if (posteIndex !== -1 && postesRestants[teamIndex][posteIndex] > 0) {

          postesRestants[teamIndex][posteIndex]--;
          noteAdj = player.note * coeffPoste[posteCol];

          if (posteCol === 0) noteAdj += 0.3;

          posteChoisi = postePossible;
          break;
        }
      }

      if (posteChoisi !== "Hors poste") break;
    }
  }

  if (teamCount[teamIndex] >= 6 && postesRestants[teamIndex][0] !== 0) { // si le poste de gardien n'est pas déjà occupé
    // le joueur en plus ne sera pas Hors Poste
    noteAdj = player.note;
    posteChoisi = "7eme";
  }

  teamScore[teamIndex] += noteAdj;
  teamRawScore[teamIndex] += player.note;
  teamCount[teamIndex]++;

  equipes[teamIndex].push({
    name: player.name,
    poste: posteChoisi,
    noteRaw: player.note,
    noteAdj: noteAdj
  });
}

function getPosteIndex(poste) {
  switch(poste) {
    case "G"  : return 0;
    case "DEF": return 1;
    case "MIL": return 2;
    case "AIL": return 3;
    case "BUT": return 4;
    default: return -1;
  }
}