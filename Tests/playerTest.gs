/**
 * Point d'entrée des tests de player.gs.
 *
 * À exécuter depuis l'éditeur Apps Script.
 */
function runPlayerTests() {
  return runTestSuite("player.gs", [
    {
      name: "countUniquePostes retourne 0 sans poste",
      test: testPlayerCountUniquePostesWithoutPoste
    },
    {
      name: "countUniquePostes compte un poste unique",
      test: testPlayerCountUniquePostesWithSinglePoste
    },
    {
      name: "countUniquePostes lit plusieurs postes dans une cellule",
      test: testPlayerCountUniquePostesInSameColumn
    },
    {
      name: "countUniquePostes agrège les quatre niveaux de poste",
      test: testPlayerCountUniquePostesAcrossColumns
    },
    {
      name: "countUniquePostes ne compte pas deux fois le même poste",
      test: testPlayerCountUniquePostesIgnoresDuplicates
    },
    {
      name: "countUniquePostes nettoie les espaces autour des postes",
      test: testPlayerCountUniquePostesTrimsValues
    },
    {
      name: "getPoolOfPlayers place les joueurs mono-poste en premier",
      test: testPlayerPoolPrioritizesSinglePostePlayers
    },
    {
      name: "getPoolOfPlayers conserve tous les joueurs",
      test: testPlayerPoolPreservesAllPlayers
    },
    {
      name: "getPoolOfPlayers ne modifie pas le tableau source",
      test: testPlayerPoolDoesNotMutateSourceArray
    },
    {
      name: "getPoolOfPlayers retourne un tableau plat",
      test: testPlayerPoolReturnsFlatArray
    },
    {
      name: "getPoolOfPlayers gère un tableau vide",
      test: testPlayerPoolWithEmptyArray
    },
    {
      name: "getPoolOfPlayers considère comme mono-poste un joueur ayant le même poste plusieurs fois",
      test: testPlayerPoolWithDuplicatedSinglePoste
    }
  ]);
}


// ======================================================
// countUniquePostes
// ======================================================

function testPlayerCountUniquePostesWithoutPoste() {
  const player = createPlayerTestData(
    "Sans poste",
    ["", "", "", ""]
  );

  const result = countUniquePostes(player);

  assertEquals(0, result);
}


function testPlayerCountUniquePostesWithSinglePoste() {
  const player = createPlayerTestData(
    "Gardien",
    ["G", "", "", ""]
  );

  const result = countUniquePostes(player);

  assertEquals(1, result);
}


function testPlayerCountUniquePostesInSameColumn() {
  const player = createPlayerTestData(
    "Polyvalent",
    ["DEF,MIL,AIL", "", "", ""]
  );

  const result = countUniquePostes(player);

  assertEquals(3, result);
}


function testPlayerCountUniquePostesAcrossColumns() {
  const player = createPlayerTestData(
    "Très polyvalent",
    [
      "DEF",
      "MIL,AIL",
      "BUT",
      "G"
    ]
  );

  const result = countUniquePostes(player);

  assertEquals(5, result);
}


function testPlayerCountUniquePostesIgnoresDuplicates() {
  const player = createPlayerTestData(
    "Défenseur",
    [
      "DEF",
      "DEF",
      "DEF,MIL",
      "MIL"
    ]
  );

  const result = countUniquePostes(player);

  assertEquals(
    2,
    result,
    "Seuls DEF et MIL doivent être comptabilisés."
  );
}


function testPlayerCountUniquePostesTrimsValues() {
  const player = createPlayerTestData(
    "Espaces",
    [
      " DEF , MIL ",
      " AIL ",
      "",
      ""
    ]
  );

  const result = countUniquePostes(player);

  assertEquals(3, result);
}


// ======================================================
// getPoolOfPlayers
// ======================================================

function testPlayerPoolPrioritizesSinglePostePlayers() {
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
   * L'ordre interne des deux groupes est aléatoire.
   * On vérifie uniquement que tous les mono-postes arrivent avant
   * les joueurs multi-postes.
   */
  assertEquals(
    1,
    countUniquePostes(result[0]),
    "Le premier joueur doit être mono-poste."
  );

  assertEquals(
    1,
    countUniquePostes(result[1]),
    "Le deuxième joueur doit être mono-poste."
  );

  assertTrue(
    countUniquePostes(result[2]) > 1,
    "Le troisième joueur doit être multi-postes."
  );

  assertTrue(
    countUniquePostes(result[3]) > 1,
    "Le quatrième joueur doit être multi-postes."
  );
}


function testPlayerPoolPreservesAllPlayers() {
  const players = [
    createPlayerTestData(
      "Joueur A",
      ["DEF", "", "", ""],
      "A"
    ),
    createPlayerTestData(
      "Joueur B",
      ["MIL,AIL", "", "", ""],
      "B"
    ),
    createPlayerTestData(
      "Joueur C",
      ["BUT", "", "", ""],
      "C"
    ),
    createPlayerTestData(
      "Joueur D",
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
    "Le nombre de joueurs doit être conservé."
  );

  assertDeepEquals(
    originalIds,
    resultIds,
    "Aucun joueur ne doit être ajouté, supprimé ou dupliqué."
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
    "Le tableau reçu ne doit pas être réordonné."
  );

  assertTrue(
    result !== players,
    "La fonction doit retourner un nouveau tableau."
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
      "Le résultat doit contenir directement des joueurs, pas des sous-tableaux."
    );
  });
}


function testPlayerPoolWithEmptyArray() {
  const result = getPoolOfPlayers([], false);

  assertDeepEquals([], result);
}


function testPlayerPoolWithDuplicatedSinglePoste() {
  const duplicatedSinglePoste = createPlayerTestData(
    "Défenseur uniquement",
    [
      "DEF",
      "DEF",
      "",
      ""
    ],
    "duplicated-single"
  );

  const multiPoste = createPlayerTestData(
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
    [multiPoste, duplicatedSinglePoste],
    false
  );

  assertEquals(
    "duplicated-single",
    result[0].id,
    "Un joueur ayant DEF dans plusieurs niveaux reste un joueur mono-poste."
  );
}


// ======================================================
// Helpers de tests
// ======================================================

function createPlayerTestData(
  name,
  postes,
  id = "test-player",
  note = 3.5
) {
  return {
    id: id,
    name: name,
    note: note,
    postes: postes
  };
}