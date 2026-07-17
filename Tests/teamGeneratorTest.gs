/**
 * Point d'entrée des tests de teamGenerator.gs.
 */
function runTeamGeneratorTests() {
  return runTestSuite("teamGenerator.gs", [
    // getPosteIndex
    {
      name: "getPosteIndex retourne l'index du gardien",
      test: testGetPosteIndexGardien
    },
    {
      name: "getPosteIndex retourne l'index du défenseur",
      test: testGetPosteIndexDefenseur
    },
    {
      name: "getPosteIndex retourne l'index du milieu",
      test: testGetPosteIndexMilieu
    },
    {
      name: "getPosteIndex retourne l'index de l'ailier",
      test: testGetPosteIndexAilier
    },
    {
      name: "getPosteIndex retourne l'index du buteur",
      test: testGetPosteIndexButeur
    },
    {
      name: "getPosteIndex retourne -1 pour un poste inconnu",
      test: testGetPosteIndexUnknownPoste
    },

    // assignPlayerToTeam
    {
      name: "assignPlayerToTeam place un joueur à son poste principal",
      test: testAssignPlayerToPrimaryPoste
    },
    {
      name: "assignPlayerToTeam applique le coefficient du deuxième niveau",
      test: testAssignPlayerToSecondaryPoste
    },
    {
      name: "assignPlayerToTeam essaie plusieurs postes d'une même cellule",
      test: testAssignPlayerWithMultiplePostesInSameLevel
    },
    {
      name: "assignPlayerToTeam passe au niveau suivant si les postes sont occupés",
      test: testAssignPlayerFallsBackToNextPosteLevel
    },
    {
      name: "assignPlayerToTeam place le joueur hors poste sans poste disponible",
      test: testAssignPlayerOutOfPosition
    },
    {
      name: "assignPlayerToTeam décrémente le nombre de postes disponibles",
      test: testAssignPlayerConsumesPosteSlot
    },
    {
      name: "assignPlayerToTeam met à jour les scores et l'effectif",
      test: testAssignPlayerUpdatesTeamData
    },
    {
      name: "assignPlayerToTeam ajoute les données du joueur dans l'équipe",
      test: testAssignPlayerAddsPlayerResult
    },
    {
      name: "assignPlayerToTeam utilise le joueur comme septième si nécessaire",
      test: testAssignPlayerAsSeventhPlayer
    },
    {
      name: "assignPlayerToTeam ne transforme pas le septième joueur si le gardien est déjà pris",
      test: testAssignSeventhPlayerWhenGoalkeeperAlreadyAssigned
    },
    {
      name: "assignPlayerToTeam traite le huitième joueur comme remplaçant numéroté",
      test: testAssignEighthPlayer
    }
  ]);
}


// ======================================================
// getPosteIndex
// ======================================================

function testGetPosteIndexGardien() {
  assertEquals(0, getPosteIndex("G"));
}


function testGetPosteIndexDefenseur() {
  assertEquals(1, getPosteIndex("DEF"));
}


function testGetPosteIndexMilieu() {
  assertEquals(2, getPosteIndex("MIL"));
}


function testGetPosteIndexAilier() {
  assertEquals(3, getPosteIndex("AIL"));
}


function testGetPosteIndexButeur() {
  assertEquals(4, getPosteIndex("BUT"));
}


function testGetPosteIndexUnknownPoste() {
  assertEquals(-1, getPosteIndex("UNKNOWN"));
  assertEquals(-1, getPosteIndex(""));
  assertEquals(-1, getPosteIndex(null));
}


// ======================================================
// assignPlayerToTeam
// ======================================================

function testAssignPlayerToPrimaryPoste() {
  const context = createAssignmentTestContext();

  const player = createTeamGeneratorTestPlayer({
    name: "Défenseur principal",
    note: 4,
    postes: ["DEF", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.equipes[0][0];

  assertEquals("DEF", assignedPlayer.poste);
  assertAlmostEquals(4, assignedPlayer.noteAdj);
}


function testAssignPlayerToSecondaryPoste() {
  const context = createAssignmentTestContext();

  const player = createTeamGeneratorTestPlayer({
    name: "Milieu secondaire",
    note: 4,
    postes: ["", "MIL", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.equipes[0][0];

  assertEquals("MIL", assignedPlayer.poste);
  assertAlmostEquals(
    3.6,
    assignedPlayer.noteAdj,
    0.000001,
    "Une note de 4 avec un coefficient de 0.9 doit donner 3.6."
  );
}


function testAssignPlayerWithMultiplePostesInSameLevel() {
  const context = createAssignmentTestContext();

  /*
   * Le poste DEF est déjà plein.
   * Le joueur doit donc prendre MIL, qui se trouve dans la même cellule.
   */
  context.postesRestants[0] = [
    1, // G
    0, // DEF
    1, // MIL
    2, // AIL
    1  // BUT
  ];

  const player = createTeamGeneratorTestPlayer({
    name: "DEF ou MIL",
    note: 4,
    postes: ["DEF,MIL", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.equipes[0][0];

  assertEquals("MIL", assignedPlayer.poste);
  assertAlmostEquals(4, assignedPlayer.noteAdj);
}


function testAssignPlayerFallsBackToNextPosteLevel() {
  const context = createAssignmentTestContext();

  /*
   * DEF est son poste de niveau 1, mais il n'y a plus de place.
   * MIL est son poste de niveau 2.
   */
  context.postesRestants[0][1] = 0;

  const player = createTeamGeneratorTestPlayer({
    name: "DEF puis MIL",
    note: 5,
    postes: ["DEF", "MIL", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.equipes[0][0];

  assertEquals("MIL", assignedPlayer.poste);
  assertAlmostEquals(4.5, assignedPlayer.noteAdj);
}


function testAssignPlayerOutOfPosition() {
  const context = createAssignmentTestContext();

  context.postesRestants[0] = [0, 0, 0, 0, 0];

  const player = createTeamGeneratorTestPlayer({
    name: "Sans place",
    note: 4,
    postes: ["DEF", "MIL", "AIL", "BUT"]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.equipes[0][0];

  assertEquals("Hors poste", assignedPlayer.poste);
  assertAlmostEquals(
    2.4,
    assignedPlayer.noteAdj,
    0.000001,
    "Une note de 4 avec le coefficient hors poste 0.6 doit donner 2.4."
  );
}


function testAssignPlayerConsumesPosteSlot() {
  const context = createAssignmentTestContext();

  const player = createTeamGeneratorTestPlayer({
    name: "Défenseur",
    note: 3.5,
    postes: ["DEF", "", "", ""]
  });

  assertEquals(2, context.postesRestants[0][1]);

  assignTestPlayer(player, context);

  assertEquals(
    1,
    context.postesRestants[0][1],
    "Une place de défenseur doit avoir été consommée."
  );
}


function testAssignPlayerUpdatesTeamData() {
  const context = createAssignmentTestContext();

  context.teamScore[0] = 5;
  context.teamRawScore[0] = 6;
  context.teamCount[0] = 1;

  const player = createTeamGeneratorTestPlayer({
    name: "Milieu",
    note: 4,
    postes: ["MIL", "", "", ""]
  });

  assignTestPlayer(player, context);

  assertAlmostEquals(9, context.teamScore[0]);
  assertAlmostEquals(10, context.teamRawScore[0]);
  assertEquals(2, context.teamCount[0]);
}


function testAssignPlayerAddsPlayerResult() {
  const context = createAssignmentTestContext();

  const player = createTeamGeneratorTestPlayer({
    id: "player-42",
    name: "Joueur test",
    note: 3.5,
    postes: ["AIL", "", "", ""]
  });

  assignTestPlayer(player, context);

  assertEquals(1, context.equipes[0].length);

  assertDeepEquals(
    {
      id: "player-42",
      name: "Joueur test",
      poste: "AIL",
      noteRaw: 3.5,
      noteAdj: 3.5
    },
    context.equipes[0][0]
  );
}


function testAssignPlayerAsSeventhPlayer() {
  const context = createAssignmentTestContext();

  /*
   * Six joueurs sont déjà présents et aucun gardien n'a été affecté.
   * Ton code transforme alors le joueur suivant en "7eme".
   */
  context.teamCount[0] = 6;
  context.postesRestants[0][0] = 1;

  const player = createTeamGeneratorTestPlayer({
    name: "Septième",
    note: 4.2,
    postes: ["DEF", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.equipes[0][0];

  assertEquals("7eme", assignedPlayer.poste);
  assertAlmostEquals(4.2, assignedPlayer.noteAdj);
  assertEquals(7, context.teamCount[0]);
}


function testAssignSeventhPlayerWhenGoalkeeperAlreadyAssigned() {
  const context = createAssignmentTestContext();

  context.teamCount[0] = 6;

  /*
   * Le poste G est déjà occupé.
   * La règle spéciale "7eme" ne doit donc pas s'appliquer.
   */
  context.postesRestants[0][0] = 0;

  const player = createTeamGeneratorTestPlayer({
    name: "Septième défenseur",
    note: 4,
    postes: ["DEF", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.equipes[0][0];

  assertEquals("DEF", assignedPlayer.poste);
  assertAlmostEquals(4, assignedPlayer.noteAdj);
}


function testAssignEighthPlayer() {
  const context = createAssignmentTestContext();

  context.teamCount[0] = 7;
  context.postesRestants[0][0] = 1;

  const player = createTeamGeneratorTestPlayer({
    name: "Remplaçant",
    note: 3.8,
    postes: ["DEF", "", "", ""]
  });

  assignTestPlayer(player, context);

  const assignedPlayer = context.equipes[0][0];

  assertEquals("8eme", assignedPlayer.poste);
  assertAlmostEquals(3.8, assignedPlayer.noteAdj);
  assertEquals(8, context.teamCount[0]);
}


// ======================================================
// Helpers
// ======================================================

function createAssignmentTestContext() {
  return {
    equipes: [[]],
    teamScore: [0],
    teamRawScore: [0],
    teamCount: [0],

    /*
     * G, DEF, MIL, AIL, BUT
     */
    postesRestants: [
      [1, 2, 1, 2, 1]
    ],

    coeffPoste: {
      0: 1,
      1: 0.9,
      2: 0.8,
      3: 0.7
    },

    coeffHorsPoste: 0.6
  };
}


function createTeamGeneratorTestPlayer(overrides) {
  const defaultPlayer = {
    id: "test-player",
    name: "Joueur test",
    note: 3.5,
    postes: ["", "", "", ""]
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
    context.equipes,
    context.teamScore,
    context.teamRawScore,
    context.teamCount,
    context.postesRestants,
    context.coeffPoste,
    context.coeffHorsPoste
  );
}