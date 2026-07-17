function getTeamIndexRandomDistribution(index, nbEquipesCompletes, randomFunction = Math.random){
  return Math.floor(randomFunction() * nbEquipesCompletes);
}

function getTeamIndexModuloDistribution(index, nbEquipesCompletes){
  return index % nbEquipesCompletes
}

function getTeamIndexSnakeDistribution(index, nbEquipesCompletes){
	const cycle = Math.floor(index / nbEquipesCompletes);
	let teamIndex;

	if (cycle % 2 === 0) {
	  teamIndex = index % nbEquipesCompletes;
	} else {
	  teamIndex = nbEquipesCompletes - 1 - (index % nbEquipesCompletes);
	}
	
	return teamIndex;
}

function getTeamIndexLessPlayerDistribution(teamCount, nbEquipesCompletes, randomFunction = Math.random) {

  const min = Math.min(...teamCount.slice(0, nbEquipesCompletes));

  const candidats = [];

  for (let i = 0; i < nbEquipesCompletes; i++) {
    if (teamCount[i] === min) {
      candidats.push(i);
    }
  }

  return candidats[Math.floor(randomFunction() * candidats.length)];
}

function getTeamIndexWeakestDistribution(teamScore, nbEquipesCompletes, randomFunction = Math.random){

  const minScore = Math.min(...teamScore.slice(0, nbEquipesCompletes));

  const candidats = [];

  for (let i = 0; i < nbEquipesCompletes; i++){
    if (teamScore[i] === minScore){
      candidats.push(i);
    }
  }

  return candidats[Math.floor(randomFunction() * candidats.length)];
}
