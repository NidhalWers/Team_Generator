function getPoolOfPlayers(joueurs, withEquipePartielle){
  const shuffled = shuffleArray([...joueurs]);

  if (withEquipePartielle){
    // lorsqu'il y a une équipe partielle, on ne classe pas les joueurs
    // afin d'éviter que les meilleurs joueurs se trouvent tous dans l'équipe partielle
    // donc il n'y aura pas d'optimisation de poste dans ce cas
    return shuffled;
  }

  // Tri par flexibilité croissante
  shuffled.sort((a, b) => {
    const diff = countUniquePostes(a) - countUniquePostes(b);
    if (diff !== 0) return diff;

    // Si même flexibilité → prioriser meilleure note
    return b.note - a.note;
  });

  return shuffled;
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