function getPoolOfPlayers(players, withPartialTeam){

  /*if (withPartialTeam){
    // When there is a partial team, do not rank players
    // to prevent all the best players from ending up on the partial team
    // so positions will not be optimized in that case
    return shuffleArray([...players]);
  }*/

  const singlePosition = [];
  const multiplePositions = [];

  players.forEach(player => {

    const versatility = countUniquePositions(player);
    if (versatility === 1) {
      singlePosition.push(player);
    } else {
      multiplePositions.push(player);
    }

  });

  shuffleArray(singlePosition);
  shuffleArray(multiplePositions);

  return [...singlePosition, ...multiplePositions];
}

function countUniquePositions(player) {
  const set = new Set();

  for (let i = 0; i < 4; i++) {
    if (!player.positions[i]) continue;

    const positions = player.positions[i]
      .toString()
      .split(",")
      .map(p => p.trim());

    positions.forEach(position => set.add(position));
  }

  return set.size;
}

function getPlayers() {
  const data = getSheetData("Players", 0);

  return data
    .filter(row => row.Player && normalizeString(row.Id) !== "")
    .map(row => ({
      id: normalizeString(row.Id),
      name: row.Player
    }));
}

function readPlayers(selectedIds, playersData){
  const selectedIdSet = new Set(
    selectedIds.map(id => normalizeString(id))
  );
  
  const players = playersData
    .filter(row => selectedIdSet.has(normalizeString(row.Id)))
    .map(row => ({
      id: normalizeString(row.Id),
      name: row.Player,
      rating: Number(row.Rating),
      positions: [
        row.Position1,
        row.Position2,
        row.Position3,
        row.Position4
      ]
    }));

  players.forEach(validatePlayerData);

  return players;
}

function validatePlayerData(player) {
  if (!player.id) {
    throw new Error(
      `A player has no Id: "${player.name}".`
    );
  }

  if (!player.name) {
    throw new Error(
      `The player with Id "${player.id}" has no name.`
    );
  }

  if (!Number.isFinite(player.rating)) {
    throw new Error(
      `The rating for player "${player.name}" is invalid.`
    );
  }
}
