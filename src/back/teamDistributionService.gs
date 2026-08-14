function getTeamIndexRandomDistribution(index, fullTeamCount, randomFunction = Math.random){
  return Math.floor(randomFunction() * fullTeamCount);
}

function getTeamIndexModuloDistribution(index, fullTeamCount){
  return index % fullTeamCount
}

function getTeamIndexSnakeDistribution(index, fullTeamCount){
	const cycle = Math.floor(index / fullTeamCount);
	let teamIndex;

	if (cycle % 2 === 0) {
	  teamIndex = index % fullTeamCount;
	} else {
	  teamIndex = fullTeamCount - 1 - (index % fullTeamCount);
	}
	
	return teamIndex;
}

function getTeamIndexLessPlayerDistribution(teamCount, fullTeamCount, randomFunction = Math.random) {

  const min = Math.min(...teamCount.slice(0, fullTeamCount));

  const candidats = [];

  for (let i = 0; i < fullTeamCount; i++) {
    if (teamCount[i] === min) {
      candidats.push(i);
    }
  }

  return candidats[Math.floor(randomFunction() * candidats.length)];
}

function getTeamIndexWeakestDistribution(teamScore, fullTeamCount, randomFunction = Math.random){

  const minScore = Math.min(...teamScore.slice(0, fullTeamCount));

  const candidats = [];

  for (let i = 0; i < fullTeamCount; i++){
    if (teamScore[i] === minScore){
      candidats.push(i);
    }
  }

  return candidats[Math.floor(randomFunction() * candidats.length)];
}