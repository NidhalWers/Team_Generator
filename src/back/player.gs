function getPoolOfPlayers(joueurs, withEquipePartielle){

  /*if (withEquipePartielle){
    // lorsqu'il y a une équipe partielle, on ne classe pas les joueurs
    // afin d'éviter que les meilleurs joueurs se trouvent tous dans l'équipe partielle
    // donc il n'y aura pas d'optimisation de poste dans ce cas
    return shuffleArray([...joueurs]);
  }*/

  const singlePoste = [];
  const multiPoste = [];

  joueurs.forEach(player => {

    const versatility = countUniquePostes(player);
    if (versatility === 1) {
      singlePoste.push(player);
    } else {
      multiPoste.push(player);
    }

  });

  shuffleArray(singlePoste);
  shuffleArray(multiPoste);

  return [...singlePoste, ...multiPoste];
}

function countUniquePostes(player) {
  const set = new Set();

  for (let i = 0; i < 4; i++) {
    if (!player.postes[i]) continue;

    const postes = player.postes[i]
      .toString()
      .split(",")
      .map(p => p.trim());

    postes.forEach(p => set.add(p));
  }

  return set.size;
}

function getJoueurs() {
  const data = getSheetData("Joueurs", 0);

  return data
    .filter(row => row.Joueur && normalizeString(row.Id) !== "")
    .map(row => ({
      id: normalizeString(row.Id),
      nom: row.Joueur
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
      name: row.Joueur,
      note: Number(row.Note),
      postes: [
        row.Poste1,
        row.Poste2,
        row.Poste3,
        row.Poste4
      ]
    }));

  players.forEach(validatePlayerData);

  return players;
}

function validatePlayerData(player) {
  if (!player.id) {
    throw new Error(
      `Un joueur ne possède pas d'Id : "${player.name}".`
    );
  }

  if (!player.name) {
    throw new Error(
      `Le joueur d'Id "${player.id}" ne possède pas de nom.`
    );
  }

  if (!Number.isFinite(player.note)) {
    throw new Error(
      `La note du joueur "${player.name}" est invalide.`
    );
  }
}
