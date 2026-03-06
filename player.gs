function getPoolOfPlayers(joueurs, withEquipePartielle){

  if (withEquipePartielle){
    // lorsqu'il y a une équipe partielle, on ne classe pas les joueurs
    // afin d'éviter que les meilleurs joueurs se trouvent tous dans l'équipe partielle
    // donc il n'y aura pas d'optimisation de poste dans ce cas
    return shuffleArray([...joueurs]);
  }

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