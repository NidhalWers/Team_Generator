function generateTeams(selectedIds) {
  Logger.log("selectedIds : " + selectedIds);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const data = getSheetData("Players", 0);
  const players = readPlayers(selectedIds, data);

  const count = players.length;

  if (count < 7) {
    return {
      error: "Not enough players selected"
    };
  }
    
  let teamsSheet = ss.getSheetByName("Teams");
  if (teamsSheet) ss.deleteSheet(teamsSheet);
  teamsSheet = ss.insertSheet("Teams");

   // ===== STRUCTURE =====
  const fullTeamCount = Math.floor(count / 7);
  const remainder = count % 7;

  let withPartialTeam = false;
  let teamCount = fullTeamCount;
  let substituteCount = 0;

  if (remainder <= fullTeamCount) {
    substituteCount = remainder;
  } else {
    withPartialTeam = true;
    teamCount = fullTeamCount + 1;
  }

  Logger.log("teamCount: " + teamCount + " | fullTeamCount: " + fullTeamCount);
  // =====
  
  // ===== MEDIAN =====
  const ratings = players.map(player => player.rating).sort((a,b)=>a-b);
  const mid = Math.floor(ratings.length / 2);
  const median = ratings.length % 2 === 0
    ? (ratings[mid-1] + ratings[mid]) / 2
    : ratings[mid];
  // =====

  const positionCoefficients = {
    0: 1.0,   // Position1
    1: 0.9,   // Position2
    2: 0.8,   // Position3
    3: 0.7    // Position4
  };

  const outOfPositionCoefficient = 0.6;

  let bestDiff = 999999;
  let bestTeams = null;
  let bestRawAverages = null;
  let bestAdjAverages = null;

  for (let sim = 0; sim < 300; sim++) {

    const poolOfPlayers = getPoolOfPlayers(players, withPartialTeam);

    const teams = [];
    const teamScore = new Array(teamCount).fill(0);
    const teamRawScore = new Array(teamCount).fill(0);
    const playerCountByTeam = new Array(teamCount).fill(0);

    for (let i = 0; i < teamCount; i++) {
      teams[i] = [];
    }

    const remainingPositions = [];
    for (let i = 0; i < teamCount; i++) {
      remainingPositions[i] = [1,2,1,2,1]; // G DEF MIL AIL BUT
    }

    const playersToDistributeCount = withPartialTeam ? fullTeamCount * 7 : poolOfPlayers.length;

    let index = 0;
    // ===== FULL TEAMS =====
    while (index < playersToDistributeCount) {

      const player = poolOfPlayers[index];
      const teamIndex = getTeamIndexModuloDistribution(index, fullTeamCount);

      assignPlayerToTeam(
        player,
        teamIndex,
        teams,
        teamScore,
        teamRawScore,
        playerCountByTeam,
        remainingPositions,
        positionCoefficients,
        outOfPositionCoefficient
      );

      index++;
    }
    // =====


    // ===== PARTIAL TEAM =====
    if (withPartialTeam) {
      var lastTeamIndex = teamCount - 1;

      while (index < poolOfPlayers.length) {

        const player = poolOfPlayers[index++];
        
        assignPlayerToTeam(
          player,
          lastTeamIndex,
          teams,
          teamScore,
          teamRawScore,
          playerCountByTeam,
          remainingPositions,
          positionCoefficients,
          outOfPositionCoefficient
        );
      }

      // Virtual completion
      while (playerCountByTeam[lastTeamIndex] < 7) {
        teamScore[lastTeamIndex] += median;
        teamRawScore[lastTeamIndex] += median;
        playerCountByTeam[lastTeamIndex]++;
      }
    }
    // =====

    const averagesScores = teamScore.map((score,i)=> score / playerCountByTeam[i]);
    // Use either one depending on the observed results.
    const stdDev = getStandardDeviation(averagesScores);
    // const stdDev = getStandardDeviation(teamScore);

    if (stdDev < bestDiff) {
      bestDiff = stdDev;
      bestTeams = JSON.parse(JSON.stringify(teams));

      bestRawAverages = teamRawScore.map((score,i)=> score / playerCountByTeam[i]);
      bestAdjAverages = teamScore.map((score,i)=> score / playerCountByTeam[i]);
    }
  }

  // Display
  teamsSheet.getRange(1,1).setValue("Optimized teams");

  for (let i = 0; i < bestTeams.length; i++) {
    teamsSheet.getRange(1, i+1).setValue("Team " + (i+1));
    for (let r = 0; r < bestTeams[i].length; r++) {
      teamsSheet.getRange(r+2, i+1).setValue(bestTeams[i][r]);
    }
  }

  // SpreadsheetApp.getUi().alert("Teams generated!");
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
  teams,
  teamScore,
  teamRawScore,
  playerCountByTeam,
  remainingPositions,
  positionCoefficients,
  outOfPositionCoefficient
) {

  let adjustedRating = player.rating * outOfPositionCoefficient;
  let selectedPosition = "Out of position";

  if (playerCountByTeam[teamIndex] < 7) {

    for (let positionColumn = 0; positionColumn < 4; positionColumn++) {

      // Skip the level if the player has no playable position there.
      if (!player.positions[positionColumn]) continue;

      const possiblePositions = player.positions[positionColumn]
        .toString()
        .split(",")
        .map(p => p.trim());

      for (let possiblePosition of possiblePositions) {

        const positionIndex = getPositionIndex(possiblePosition);

        if (positionIndex !== -1 && remainingPositions[teamIndex][positionIndex] > 0) {

          remainingPositions[teamIndex][positionIndex]--;
          adjustedRating = player.rating * positionCoefficients[positionColumn];

          // if (positionColumn === 0) adjustedRating += 0.3;

          selectedPosition = possiblePosition;
          break;
        }
      }

      if (selectedPosition !== "Out of position") break;
    }
  }

  if (playerCountByTeam[teamIndex] >= 6 && remainingPositions[teamIndex][0] !== 0) { // If the goalkeeper position is not already occupied.
    // The extra player will not be marked as out of position.
    adjustedRating = player.rating;
    selectedPosition = (playerCountByTeam[teamIndex] + 1) + "th";
  }

  teamScore[teamIndex] += adjustedRating;
  teamRawScore[teamIndex] += player.rating;
  playerCountByTeam[teamIndex]++;

  teams[teamIndex].push({
    id: player.id,
    name: player.name,
    position: selectedPosition,
    rawRating: player.rating,
    adjustedRating: adjustedRating
  });
}

function getPositionIndex(position) {
  switch(position) {
    case "G"  : return 0;
    case "DEF": return 1;
    case "MIL": return 2;
    case "AIL": return 3;
    case "BUT": return 4;
    default: return -1;
  }
}
