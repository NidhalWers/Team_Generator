/**
 * Point d'entrée des tests de teamDistributionService.gs.
 */
function runTeamDistributionServiceTests() {
  return runTestSuite(
    "teamDistributionService.gs",
    [
      {
        name: "La distribution aléatoire sélectionne la première équipe avec un hasard à 0",
        test: testRandomDistributionSelectsFirstTeam
      },
      {
        name: "La distribution aléatoire sélectionne la dernière équipe avec un hasard proche de 1",
        test: testRandomDistributionSelectsLastTeam
      },
      {
        name: "La distribution aléatoire retourne toujours un index valide",
        test: testRandomDistributionReturnsValidIndex
      },
      {
        name: "La distribution modulo répartit les joueurs cycliquement",
        test: testModuloDistribution
      },
      {
        name: "La distribution modulo recommence à la première équipe",
        test: testModuloDistributionWrapsAround
      },
      {
        name: "La distribution snake suit le bon ordre avec deux équipes",
        test: testSnakeDistributionWithTwoTeams
      },
      {
        name: "La distribution snake suit le bon ordre avec trois équipes",
        test: testSnakeDistributionWithThreeTeams
      },
      {
        name: "La distribution snake retourne toujours un index valide",
        test: testSnakeDistributionReturnsValidIndex
      },
      {
        name: "La distribution par effectif choisit l'équipe ayant le moins de joueurs",
        test: testLessPlayerDistributionSelectsSmallestTeam
      },
      {
        name: "La distribution par effectif choisit aléatoirement entre plusieurs équipes minimales",
        test: testLessPlayerDistributionHandlesTies
      },
      {
        name: "La distribution par effectif ignore les équipes situées après nbEquipesCompletes",
        test: testLessPlayerDistributionIgnoresExtraTeams
      },
      {
        name: "La distribution par score choisit l'équipe la plus faible",
        test: testWeakestDistributionSelectsWeakestTeam
      },
      {
        name: "La distribution par score choisit aléatoirement entre plusieurs équipes faibles",
        test: testWeakestDistributionHandlesTies
      },
      {
        name: "La distribution par score ignore les équipes situées après nbEquipesCompletes",
        test: testWeakestDistributionIgnoresExtraTeams
      }
    ]
  );
}


// ======================================================
// getTeamIndexRandomDistribution
// ======================================================

function testRandomDistributionSelectsFirstTeam() {
  const result = getTeamIndexRandomDistribution(
    42,
    3,
    () => 0
  );

  assertEquals(0, result);
}


function testRandomDistributionSelectsLastTeam() {
  const result = getTeamIndexRandomDistribution(
    42,
    3,
    () => 0.999999
  );

  assertEquals(2, result);
}


function testRandomDistributionReturnsValidIndex() {
  const randomValues = [
    0,
    0.1,
    0.25,
    0.5,
    0.75,
    0.999999
  ];

  randomValues.forEach(randomValue => {
    const result = getTeamIndexRandomDistribution(
      0,
      4,
      () => randomValue
    );

    assertTrue(
      result >= 0 && result < 4,
      `Index invalide pour random=${randomValue} : ${result}`
    );
  });
}


// ======================================================
// getTeamIndexModuloDistribution
// ======================================================

function testModuloDistribution() {
  const results = [];

  for (let index = 0; index < 8; index++) {
    results.push(
      getTeamIndexModuloDistribution(
        index,
        3
      )
    );
  }

  assertDeepEquals(
    [0, 1, 2, 0, 1, 2, 0, 1],
    results
  );
}


function testModuloDistributionWrapsAround() {
  assertEquals(
    0,
    getTeamIndexModuloDistribution(3, 3)
  );

  assertEquals(
    1,
    getTeamIndexModuloDistribution(4, 3)
  );

  assertEquals(
    2,
    getTeamIndexModuloDistribution(5, 3)
  );
}


// ======================================================
// getTeamIndexSnakeDistribution
// ======================================================

function testSnakeDistributionWithTwoTeams() {
  const results = [];

  for (let index = 0; index < 8; index++) {
    results.push(
      getTeamIndexSnakeDistribution(
        index,
        2
      )
    );
  }

  /*
   * Cycles :
   *
   * 0, 1
   * 1, 0
   * 0, 1
   * 1, 0
   */
  assertDeepEquals(
    [0, 1, 1, 0, 0, 1, 1, 0],
    results
  );
}


function testSnakeDistributionWithThreeTeams() {
  const results = [];

  for (let index = 0; index < 12; index++) {
    results.push(
      getTeamIndexSnakeDistribution(
        index,
        3
      )
    );
  }

  /*
   * Cycles :
   *
   * 0, 1, 2
   * 2, 1, 0
   * 0, 1, 2
   * 2, 1, 0
   */
  assertDeepEquals(
    [
      0, 1, 2,
      2, 1, 0,
      0, 1, 2,
      2, 1, 0
    ],
    results
  );
}


function testSnakeDistributionReturnsValidIndex() {
  for (let index = 0; index < 100; index++) {
    const result = getTeamIndexSnakeDistribution(
      index,
      4
    );

    assertTrue(
      result >= 0 && result < 4,
      `Index invalide pour le joueur ${index} : ${result}`
    );
  }
}


// ======================================================
// getTeamIndexLessPlayerDistribution
// ======================================================

function testLessPlayerDistributionSelectsSmallestTeam() {
  const result = getTeamIndexLessPlayerDistribution(
    [7, 5, 6],
    3,
    () => 0
  );

  assertEquals(
    1,
    result,
    "L'équipe 1 possède le plus petit effectif."
  );
}


function testLessPlayerDistributionHandlesTies() {
  const teamCount = [5, 7, 5];

  const firstCandidate =
    getTeamIndexLessPlayerDistribution(
      teamCount,
      3,
      () => 0
    );

  const secondCandidate =
    getTeamIndexLessPlayerDistribution(
      teamCount,
      3,
      () => 0.999999
    );

  assertEquals(
    0,
    firstCandidate,
    "Le premier candidat minimal doit être choisi."
  );

  assertEquals(
    2,
    secondCandidate,
    "Le dernier candidat minimal doit être choisi."
  );
}


function testLessPlayerDistributionIgnoresExtraTeams() {
  /*
   * L'équipe située à l'index 2 représente par exemple
   * une équipe partielle.
   *
   * Elle a moins de joueurs, mais nbEquipesCompletes vaut 2 :
   * seuls les index 0 et 1 doivent être étudiés.
   */
  const result = getTeamIndexLessPlayerDistribution(
    [7, 6, 1],
    2,
    () => 0
  );

  assertEquals(1, result);
}


// ======================================================
// getTeamIndexWeakestDistribution
// ======================================================

function testWeakestDistributionSelectsWeakestTeam() {
  const result = getTeamIndexWeakestDistribution(
    [24.5, 21.2, 23.8],
    3,
    () => 0
  );

  assertEquals(
    1,
    result,
    "L'équipe 1 possède le plus petit score."
  );
}


function testWeakestDistributionHandlesTies() {
  const teamScore = [20, 25, 20];

  const firstCandidate =
    getTeamIndexWeakestDistribution(
      teamScore,
      3,
      () => 0
    );

  const secondCandidate =
    getTeamIndexWeakestDistribution(
      teamScore,
      3,
      () => 0.999999
    );

  assertEquals(
    0,
    firstCandidate,
    "Le premier candidat faible doit être choisi."
  );

  assertEquals(
    2,
    secondCandidate,
    "Le dernier candidat faible doit être choisi."
  );
}


function testWeakestDistributionIgnoresExtraTeams() {
  /*
   * L'équipe à l'index 2 a le plus petit score,
   * mais elle ne fait pas partie des équipes complètes.
   */
  const result = getTeamIndexWeakestDistribution(
    [24, 22, 5],
    2,
    () => 0
  );

  assertEquals(1, result);
}