/**
 * Entry point for the tests for player.gs.
 *
 * Run from the Apps Script editor.
 */
function runPlayerTests() {
  return runTestSuite("player.gs", [
    {
      name: "countUniquePositions returns 0 with no position",
      test: testPlayerCountUniquePositionsWithoutPosition
    },
    {
      name: "countUniquePositions counts one unique position",
      test: testPlayerCountUniquePositionsWithSinglePosition
    },
    {
      name: "countUniquePositions reads multiple positions from one cell",
      test: testPlayerCountUniquePositionsInSameColumn
    },
    {
      name: "countUniquePositions combines all four position levels",
      test: testPlayerCountUniquePositionsAcrossColumns
    },
    {
      name: "countUniquePositions does not count the same position twice",
      test: testPlayerCountUniquePositionsIgnoresDuplicates
    },
    {
      name: "countUniquePositions trims whitespace around positions",
      test: testPlayerCountUniquePositionsTrimsValues
    },
    {
      name: "getPoolOfPlayers places single-position players first",
      test: testPlayerPoolPrioritizesSinglePositionPlayers
    },
    {
      name: "getPoolOfPlayers preserves all players",
      test: testPlayerPoolPreservesAllPlayers
    },
    {
      name: "getPoolOfPlayers does not mutate the source array",
      test: testPlayerPoolDoesNotMutateSourceArray
    },
    {
      name: "getPoolOfPlayers returns a flat array",
      test: testPlayerPoolReturnsFlatArray
    },
    {
      name: "getPoolOfPlayers handles an empty array",
      test: testPlayerPoolWithEmptyArray
    },
    {
      name: "getPoolOfPlayers treats a player with the same position multiple times as single-position",
      test: testPlayerPoolWithDuplicatedSinglePosition
    }
  ]);
}


// ======================================================
// countUniquePositions
// ======================================================

function testPlayerCountUniquePositionsWithoutPosition() {
  const player = createPlayerTestData(
    "No position",
    ["", "", "", ""]
  );

  const result = countUniquePositions(player);

  assertEquals(0, result);
}


function testPlayerCountUniquePositionsWithSinglePosition() {
  const player = createPlayerTestData(
    "Goalkeeper",
    ["G", "", "", ""]
  );

  const result = countUniquePositions(player);

  assertEquals(1, result);
}


function testPlayerCountUniquePositionsInSameColumn() {
  const player = createPlayerTestData(
    "Polyvalent",
    ["DEF,MIL,AIL", "", "", ""]
  );

  const result = countUniquePositions(player);

  assertEquals(3, result);
}


function testPlayerCountUniquePositionsAcrossColumns() {
  const player = createPlayerTestData(
    "Highly versatile",
    [
      "DEF",
      "MIL,AIL",
      "BUT",
      "G"
    ]
  );

  const result = countUniquePositions(player);

  assertEquals(5, result);
}


function testPlayerCountUniquePositionsIgnoresDuplicates() {
  const player = createPlayerTestData(
    "Defender",
    [
      "DEF",
      "DEF",
      "DEF,MIL",
      "MIL"
    ]
  );

  const result = countUniquePositions(player);

  assertEquals(
    2,
    result,
    "Only DEF and MIL should be counted."
  );
}


function testPlayerCountUniquePositionsTrimsValues() {
  const player = createPlayerTestData(
    "Espaces",
    [
      " DEF , MIL ",
      " AIL ",
      "",
      ""
    ]
  );

  const result = countUniquePositions(player);

  assertEquals(3, result);
}


// ======================================================
// getPoolOfPlayers
// ======================================================

function testPlayerPoolPrioritizesSinglePositionPlayers() {
  const players = [
    createPlayerTestData(
      "Multi 1",
      ["DEF,MIL", "", "", ""],
      "multi-1"
    ),
    createPlayerTestData(
      "Mono 1",
      ["G", "", "", ""],
      "mono-1"
    ),
    createPlayerTestData(
      "Multi 2",
      ["AIL", "BUT", "", ""],
      "multi-2"
    ),
    createPlayerTestData(
      "Mono 2",
      ["DEF", "", "", ""],
      "mono-2"
    )
  ];

  const result = getPoolOfPlayers(players, false);

  /*
   * The internal order of both groups is random.
   * Only verify that all single-position players come before
   * multiple-position players.
   */
  assertEquals(
    1,
    countUniquePositions(result[0]),
    "The first player must be single-position."
  );

  assertEquals(
    1,
    countUniquePositions(result[1]),
    "The second player must be single-position."
  );

  assertTrue(
    countUniquePositions(result[2]) > 1,
    "The third player must have multiple positions."
  );

  assertTrue(
    countUniquePositions(result[3]) > 1,
    "The fourth player must have multiple positions."
  );
}


function testPlayerPoolPreservesAllPlayers() {
  const players = [
    createPlayerTestData(
      "Player A",
      ["DEF", "", "", ""],
      "A"
    ),
    createPlayerTestData(
      "Player B",
      ["MIL,AIL", "", "", ""],
      "B"
    ),
    createPlayerTestData(
      "Player C",
      ["BUT", "", "", ""],
      "C"
    ),
    createPlayerTestData(
      "Player D",
      ["DEF", "MIL", "", ""],
      "D"
    )
  ];

  const result = getPoolOfPlayers(players, false);

  const originalIds = players
    .map(player => player.id)
    .sort();

  const resultIds = result
    .map(player => player.id)
    .sort();

  assertEquals(
    players.length,
    result.length,
    "The player count must be preserved."
  );

  assertDeepEquals(
    originalIds,
    resultIds,
    "No player may be added, removed, or duplicated."
  );
}


function testPlayerPoolDoesNotMutateSourceArray() {
  const players = [
    createPlayerTestData(
      "Multi",
      ["DEF,MIL", "", "", ""],
      "multi"
    ),
    createPlayerTestData(
      "Mono",
      ["G", "", "", ""],
      "mono"
    ),
    createPlayerTestData(
      "Autre",
      ["AIL,BUT", "", "", ""],
      "other"
    )
  ];

  const originalOrder = players.map(player => player.id);

  const result = getPoolOfPlayers(players, false);

  assertDeepEquals(
    ["multi", "mono", "other"],
    originalOrder
  );

  assertDeepEquals(
    originalOrder,
    players.map(player => player.id),
    "The input array must not be reordered."
  );

  assertTrue(
    result !== players,
    "The function must return a new array."
  );
}


function testPlayerPoolReturnsFlatArray() {
  const players = [
    createPlayerTestData(
      "Mono",
      ["DEF", "", "", ""],
      "mono"
    ),
    createPlayerTestData(
      "Multi",
      ["DEF,MIL", "", "", ""],
      "multi"
    )
  ];

  const result = getPoolOfPlayers(players, false);

  assertTrue(Array.isArray(result));

  result.forEach(player => {
    assertTrue(
      !Array.isArray(player),
      "The result must contain players directly, not nested arrays."
    );
  });
}


function testPlayerPoolWithEmptyArray() {
  const result = getPoolOfPlayers([], false);

  assertDeepEquals([], result);
}


function testPlayerPoolWithDuplicatedSinglePosition() {
  const duplicatedSinglePosition = createPlayerTestData(
    "Defender only",
    [
      "DEF",
      "DEF",
      "",
      ""
    ],
    "duplicated-single"
  );

  const multiPosition = createPlayerTestData(
    "Polyvalent",
    [
      "DEF,MIL",
      "",
      "",
      ""
    ],
    "multi"
  );

  const result = getPoolOfPlayers(
    [multiPosition, duplicatedSinglePosition],
    false
  );

  assertEquals(
    "duplicated-single",
    result[0].id,
    "A player with DEF in multiple levels remains a single-position player."
  );
}


// ======================================================
// Test helpers
// ======================================================

function createPlayerTestData(
  name,
  positions,
  id = "test-player",
  rating = 3.5
) {
  return {
    id: id,
    name: name,
    rating: rating,
    positions: positions
  };
}
