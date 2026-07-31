/**
 * Entry point for the tests for teamGenerator.gs.
 */
function runTeamGeneratorTests() {
  return runTestSuite("teamGenerator.gs", [
    // getPositionIndex
    {
      name: "getPositionIndex returns the goalkeeper index",
      test: testGetPositionIndexGoalkeeper
    },
    {
      name: "getPositionIndex returns the defender index",
      test: testGetPositionIndexDefender
    },
    {
      name: "getPositionIndex returns the midfielder index",
      test: testGetPositionIndexMidfielder
    },
    {
      name: "getPositionIndex returns the winger index",
      test: testGetPositionIndexWinger
    },
    {
      name: "getPositionIndex returns the striker index",
      test: testGetPositionIndexStriker
    },
    {
      name: "getPositionIndex returns -1 for an unknown position",
      test: testGetPositionIndexUnknownPosition
    },

    // assignPlayerToTeam
    {
      name: "assignPlayerToTeam assigns a player to their primary position",
      test: testAssignPlayerToPrimaryPosition
    },
    {
      name: "assignPlayerToTeam applies the second-level coefficient",
      test: testAssignPlayerToSecondaryPosition
    },
    {
      name: "assignPlayerToTeam tries multiple positions from the same cell",
      test: testAssignPlayerWithMultiplePositionsInSameLevel
    },
    {
      name: "assignPlayerToTeam falls back to the next level when positions are occupied",
      test: testAssignPlayerFallsBackToNextPositionLevel
    },
    {
      name: "assignPlayerToTeam places the player out of position when no position is available",
      test: testAssignPlayerOutOfPosition
    },
    {
      name: "assignPlayerToTeam decrements the number of available positions",
      test: testAssignPlayerConsumesPositionSlot
    },
    {
      name: "assignPlayerToTeam updates scores and player count",
      test: testAssignPlayerUpdatesTeamData
    },
    {
      name: "assignPlayerToTeam adds player data to the team",
      test: testAssignPlayerAddsPlayerResult
    },
    {
      name: "assignPlayerToTeam uses the player as the seventh player when needed",
      test: testAssignPlayerAsSeventhPlayer
    },
    {
      name: "assignPlayerToTeam does not transform the seventh player when goalkeeper is occupied",
      test: testAssignSeventhPlayerWhenGoalkeeperAlreadyAssigned
    },
    {
      name: "assignPlayerToTeam treats the eighth player as a numbered substitute",
      test: testAssignEighthPlayer
    }
  ]);
}


// ======================================================
// getPositionIndex
// ======================================================

function testGetPositionIndexGoalkeeper() {
  assertEquals(0, getPositionIndex("G"));
}


function testGetPositionIndexDefender() {
  assertEquals(1, getPositionIndex("DEF"));
}


function testGetPositionIndexMidfielder() {
  assertEquals(2, getPositionIndex("MIL"));
}


function testGetPositionIndexWinger() {
  assertEquals(3, getPositionIndex("AIL"));
}


function testGetPositionIndexStriker() {
  assertEquals(4, getPositionIndex("BUT"));
}


function testGetPositionIndexUnknownPosition() {
  assertEquals(-1, getPositionIndex("UNKNOWN"));
  assertEquals(-1, getPositionIndex(""));
  assertEquals(-1, getPositionIndex(null));
}


// ======================================================
// assignPlayerToTeam
// ======================================================

function testAssignPlayerToPrimaryPosition() {
  const context = createAssignmentTestContext();

  const player = createTeamGeneratorTestPlayer({
    name: "Primary defender",
    rating: 4,
    positions: ["DEF", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.teams[0][0];

  assertEquals("DEF", assignedPlayer.position);
  assertAlmostEquals(4, assignedPlayer.adjustedRating);
}


function testAssignPlayerToSecondaryPosition() {
  const context = createAssignmentTestContext();

  const player = createTeamGeneratorTestPlayer({
    name: "Midfielder secondaire",
    rating: 4,
    positions: ["", "MIL", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.teams[0][0];

  assertEquals("MIL", assignedPlayer.position);
  assertAlmostEquals(
    3.6,
    assignedPlayer.adjustedRating,
    0.000001,
    "A rating of 4 with a coefficient of 0.9 must produce 3.6."
  );
}


function testAssignPlayerWithMultiplePositionsInSameLevel() {
  const context = createAssignmentTestContext();

  /*
   * The DEF position is already full.
   * The player must therefore take MIL, which is in the same cell.
   */
  context.remainingPositions[0] = [
    1, // G
    0, // DEF
    1, // MIL
    2, // AIL
    1  // BUT
  ];

  const player = createTeamGeneratorTestPlayer({
    name: "DEF or MIL",
    rating: 4,
    positions: ["DEF,MIL", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.teams[0][0];

  assertEquals("MIL", assignedPlayer.position);
  assertAlmostEquals(4, assignedPlayer.adjustedRating);
}


function testAssignPlayerFallsBackToNextPositionLevel() {
  const context = createAssignmentTestContext();

  /*
   * DEF is the player's level 1 position, but no slot remains.
   * MIL is the player's level 2 position.
   */
  context.remainingPositions[0][1] = 0;

  const player = createTeamGeneratorTestPlayer({
    name: "DEF puis MIL",
    rating: 5,
    positions: ["DEF", "MIL", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.teams[0][0];

  assertEquals("MIL", assignedPlayer.position);
  assertAlmostEquals(4.5, assignedPlayer.adjustedRating);
}


function testAssignPlayerOutOfPosition() {
  const context = createAssignmentTestContext();

  context.remainingPositions[0] = [0, 0, 0, 0, 0];

  const player = createTeamGeneratorTestPlayer({
    name: "No available slot",
    rating: 4,
    positions: ["DEF", "MIL", "AIL", "BUT"]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.teams[0][0];

  assertEquals("Out of position", assignedPlayer.position);
  assertAlmostEquals(
    2.4,
    assignedPlayer.adjustedRating,
    0.000001,
    "A rating of 4 with the out-of-position coefficient 0.6 must produce 2.4."
  );
}


function testAssignPlayerConsumesPositionSlot() {
  const context = createAssignmentTestContext();

  const player = createTeamGeneratorTestPlayer({
    name: "Defender",
    rating: 3.5,
    positions: ["DEF", "", "", ""]
  });

  assertEquals(2, context.remainingPositions[0][1]);

  assignTestPlayer(player, context);

  assertEquals(
    1,
    context.remainingPositions[0][1],
    "One defender slot must have been consumed."
  );
}


function testAssignPlayerUpdatesTeamData() {
  const context = createAssignmentTestContext();

  context.teamScore[0] = 5;
  context.teamRawScore[0] = 6;
  context.playerCountByTeam[0] = 1;

  const player = createTeamGeneratorTestPlayer({
    name: "Midfielder",
    rating: 4,
    positions: ["MIL", "", "", ""]
  });

  assignTestPlayer(player, context);

  assertAlmostEquals(9, context.teamScore[0]);
  assertAlmostEquals(10, context.teamRawScore[0]);
  assertEquals(2, context.playerCountByTeam[0]);
}


function testAssignPlayerAddsPlayerResult() {
  const context = createAssignmentTestContext();

  const player = createTeamGeneratorTestPlayer({
    id: "player-42",
    name: "Test player",
    rating: 3.5,
    positions: ["AIL", "", "", ""]
  });

  assignTestPlayer(player, context);

  assertEquals(1, context.teams[0].length);

  assertDeepEquals(
    {
      id: "player-42",
      name: "Test player",
      position: "AIL",
      rawRating: 3.5,
      adjustedRating: 3.5
    },
    context.teams[0][0]
  );
}


function testAssignPlayerAsSeventhPlayer() {
  const context = createAssignmentTestContext();

  /*
   * Six players are already present and no goalkeeper has been assigned.
   * The code then turns the next player into "7th".
   */
  context.playerCountByTeam[0] = 6;
  context.remainingPositions[0][0] = 1;

  const player = createTeamGeneratorTestPlayer({
    name: "Seventh",
    rating: 4.2,
    positions: ["DEF", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.teams[0][0];

  assertEquals("7th", assignedPlayer.position);
  assertAlmostEquals(4.2, assignedPlayer.adjustedRating);
  assertEquals(7, context.playerCountByTeam[0]);
}


function testAssignSeventhPlayerWhenGoalkeeperAlreadyAssigned() {
  const context = createAssignmentTestContext();

  context.playerCountByTeam[0] = 6;

  /*
   * The G position is already occupied.
   * The special "7th" rule must therefore not apply.
   */
  context.remainingPositions[0][0] = 0;

  const player = createTeamGeneratorTestPlayer({
    name: "Seventh defender",
    rating: 4,
    positions: ["DEF", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.teams[0][0];

  assertEquals("DEF", assignedPlayer.position);
  assertAlmostEquals(4, assignedPlayer.adjustedRating);
}


function testAssignEighthPlayer() {
  const context = createAssignmentTestContext();

  context.playerCountByTeam[0] = 7;
  context.remainingPositions[0][0] = 1;

  const player = createTeamGeneratorTestPlayer({
    name: "Substitute",
    rating: 3.8,
    positions: ["DEF", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.teams[0][0];

  assertEquals("8th", assignedPlayer.position);
  assertAlmostEquals(3.8, assignedPlayer.adjustedRating);
  assertEquals(8, context.playerCountByTeam[0]);
}


// ======================================================
// Helpers
// ======================================================

function createAssignmentTestContext() {
  return {
    teams: [[]],
    teamScore: [0],
    teamRawScore: [0],
    playerCountByTeam: [0],

    /*
     * G, DEF, MIL, AIL, BUT
     */
    remainingPositions: [
      [1, 2, 1, 2, 1]
    ],

    positionCoefficients: {
      0: 1,
      1: 0.9,
      2: 0.8,
      3: 0.7
    },

    outOfPositionCoefficient: 0.6
  };
}


function createTeamGeneratorTestPlayer(overrides) {
  const defaultPlayer = {
    id: "test-player",
    name: "Test player",
    rating: 3.5,
    positions: ["", "", "", ""]
  };

  return Object.assign(
    {},
    defaultPlayer,
    overrides || {}
  );
}


function assignTestPlayer(player, context, teamIndex = 0) {
  assignPlayerToTeam(
    player,
    teamIndex,
    context.teams,
    context.teamScore,
    context.teamRawScore,
    context.playerCountByTeam,
    context.remainingPositions,
    context.positionCoefficients,
    context.outOfPositionCoefficient
  );
}
