/**
 * Entry point for the tests for teamDistributionService.gs.
 */
function runTeamDistributionServiceTests() {
  return runTestSuite(
    "teamDistributionService.gs",
    [
      {
        name: "Random distribution selects the first team when random is 0",
        test: testRandomDistributionSelectsFirstTeam
      },
      {
        name: "Random distribution selects the last team when random is close to 1",
        test: testRandomDistributionSelectsLastTeam
      },
      {
        name: "Random distribution always returns a valid index",
        test: testRandomDistributionReturnsValidIndex
      },
      {
        name: "Modulo distribution assigns players cyclically",
        test: testModuloDistribution
      },
      {
        name: "Modulo distribution wraps around to the first team",
        test: testModuloDistributionWrapsAround
      },
      {
        name: "Snake distribution follows the correct order with two teams",
        test: testSnakeDistributionWithTwoTeams
      },
      {
        name: "Snake distribution follows the correct order with three teams",
        test: testSnakeDistributionWithThreeTeams
      },
      {
        name: "Snake distribution always returns a valid index",
        test: testSnakeDistributionReturnsValidIndex
      },
      {
        name: "Player-count distribution selects the team with the fewest players",
        test: testLessPlayerDistributionSelectsSmallestTeam
      },
      {
        name: "Player-count distribution randomly selects among tied smallest teams",
        test: testLessPlayerDistributionHandlesTies
      },
      {
        name: "Player-count distribution ignores teams after fullTeamCount",
        test: testLessPlayerDistributionIgnoresExtraTeams
      },
      {
        name: "Score distribution selects the weakest team",
        test: testWeakestDistributionSelectsWeakestTeam
      },
      {
        name: "Score distribution randomly selects among tied weakest teams",
        test: testWeakestDistributionHandlesTies
      },
      {
        name: "Score distribution ignores teams after fullTeamCount",
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
      `Invalid index for random=${randomValue} : ${result}`
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
      `Invalid index for player ${index} : ${result}`
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
    "Team 1 has the fewest players."
  );
}


function testLessPlayerDistributionHandlesTies() {
  const playerCountByTeam = [5, 7, 5];

  const firstCandidate =
    getTeamIndexLessPlayerDistribution(
      playerCountByTeam,
      3,
      () => 0
    );

  const secondCandidate =
    getTeamIndexLessPlayerDistribution(
      playerCountByTeam,
      3,
      () => 0.999999
    );

  assertEquals(
    0,
    firstCandidate,
    "The first minimum candidate must be selected."
  );

  assertEquals(
    2,
    secondCandidate,
    "The last minimum candidate must be selected."
  );
}


function testLessPlayerDistributionIgnoresExtraTeams() {
  /*
   * The team at index 2 represents, for example,
   * a partial team.
   *
   * It has fewer players, but fullTeamCount is 2:
   * only indexes 0 and 1 must be considered.
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
    "Team 1 has the lowest score."
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
    "The first weak candidate must be selected."
  );

  assertEquals(
    2,
    secondCandidate,
    "The last weak candidate must be selected."
  );
}


function testWeakestDistributionIgnoresExtraTeams() {
  /*
   * The team at index 2 has the lowest score,
   * but it is not one of the full teams.
   */
  const result = getTeamIndexWeakestDistribution(
    [24, 22, 5],
    2,
    () => 0
  );

  assertEquals(1, result);
}
