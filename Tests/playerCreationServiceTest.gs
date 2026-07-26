/**
 * Point d'entrée des tests de playerCreationService.gs.
 */
function runPlayerCreationServiceTests() {
  return runTestSuite(
    "playerCreationService.gs",
    [
      // normalizePositionCell
      {
        name: "normalizePositionCell retourne une chaîne vide sans valeur",
        test: testNormalizePositionCellWithEmptyValue
      },
      {
        name: "normalizePositionCell normalise une chaîne simple",
        test: testNormalizePositionCellWithString
      },
      {
        name: "normalizePositionCell normalise plusieurs postes dans une chaîne",
        test: testNormalizePositionCellWithMultipleStringValues
      },
      {
        name: "normalizePositionCell normalise un tableau de postes",
        test: testNormalizePositionCellWithArray
      },
      {
        name: "normalizePositionCell ignore les valeurs vides",
        test: testNormalizePositionCellIgnoresEmptyValues
      },

      // validateAndNormalizePlayerInput
      {
        name: "validateAndNormalizePlayerInput normalise une saisie valide",
        test: testValidatePlayerInputValidInput
      },
      {
        name: "validateAndNormalizePlayerInput accepte plusieurs postes par niveau",
        test: testValidatePlayerInputWithMultiplePositions
      },
      {
        name: "validateAndNormalizePlayerInput refuse une saisie absente",
        test: testValidatePlayerInputMissingInput
      },
      {
        name: "validateAndNormalizePlayerInput refuse un nom vide",
        test: testValidatePlayerInputEmptyName
      },
      {
        name: "validateAndNormalizePlayerInput nettoie le nom",
        test: testValidatePlayerInputTrimsName
      },
      {
        name: "validateAndNormalizePlayerInput refuse une note inférieure à 0,5",
        test: testValidatePlayerInputNoteTooLow
      },
      {
        name: "validateAndNormalizePlayerInput refuse une note supérieure à 5",
        test: testValidatePlayerInputNoteTooHigh
      },
      {
        name: "validateAndNormalizePlayerInput refuse une note non numérique",
        test: testValidatePlayerInputInvalidNote
      },
      {
        name: "validateAndNormalizePlayerInput refuse une note hors palier de 0,5",
        test: testValidatePlayerInputInvalidHalfStep
      },
      {
        name: "validateAndNormalizePlayerInput refuse un poste inconnu",
        test: testValidatePlayerInputUnknownPosition
      },
      {
        name: "validateAndNormalizePlayerInput refuse un poste présent dans plusieurs niveaux",
        test: testValidatePlayerInputDuplicatedPosition
      },
      {
        name: "validateAndNormalizePlayerInput accepte l'absence de postes",
        test: testValidatePlayerInputWithoutPositions
      }
    ]
  );
}


// ======================================================
// normalizePositionCell
// ======================================================

function testNormalizePositionCellWithEmptyValue() {
  assertEquals("", normalizePositionCell(""));
  assertEquals("", normalizePositionCell(null));
  assertEquals("", normalizePositionCell(undefined));
}


function testNormalizePositionCellWithString() {
  assertEquals(
    "DEF",
    normalizePositionCell(" def ")
  );
}


function testNormalizePositionCellWithMultipleStringValues() {
  assertEquals(
    "DEF,MIL,AIL",
    normalizePositionCell(
      " def, MIL , ail "
    )
  );
}


function testNormalizePositionCellWithArray() {
  assertEquals(
    "G,DEF,BUT",
    normalizePositionCell([
      " g ",
      "DEF",
      " but "
    ])
  );
}


function testNormalizePositionCellIgnoresEmptyValues() {
  assertEquals(
    "DEF,MIL",
    normalizePositionCell([
      "",
      "DEF",
      " ",
      null,
      "MIL"
    ])
  );
}


// ======================================================
// validateAndNormalizePlayerInput
// ======================================================

function testValidatePlayerInputValidInput() {
  const input = createValidPlayerCreationInput();

  const result =
    validateAndNormalizePlayerInput(input);

  assertDeepEquals(
    {
      name: "Alice",
      manualNote: 3.5,
      postes: [
        "DEF",
        "MIL",
        "AIL",
        "BUT"
      ]
    },
    result
  );
}


function testValidatePlayerInputWithMultiplePositions() {
  const input = createValidPlayerCreationInput({
    poste1: ["DEF", "MIL"],
    poste2: ["AIL"],
    poste3: ["BUT"],
    poste4: []
  });

  const result =
    validateAndNormalizePlayerInput(input);

  assertDeepEquals(
    [
      "DEF,MIL",
      "AIL",
      "BUT",
      ""
    ],
    result.postes
  );
}


function testValidatePlayerInputMissingInput() {
  assertThrows(
    () => validateAndNormalizePlayerInput(null),
    "Les informations du joueur sont manquantes"
  );
}


function testValidatePlayerInputEmptyName() {
  const input = createValidPlayerCreationInput({
    name: "   "
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "Le nom du joueur est obligatoire"
  );
}


function testValidatePlayerInputTrimsName() {
  const input = createValidPlayerCreationInput({
    name: "  Alice Dupont  "
  });

  const result =
    validateAndNormalizePlayerInput(input);

  assertEquals(
    "Alice Dupont",
    result.name
  );
}


function testValidatePlayerInputNoteTooLow() {
  const input = createValidPlayerCreationInput({
    manualNote: 0
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "comprise entre 0,5 et 5"
  );
}


function testValidatePlayerInputNoteTooHigh() {
  const input = createValidPlayerCreationInput({
    manualNote: 5.5
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "comprise entre 0,5 et 5"
  );
}


function testValidatePlayerInputInvalidNote() {
  const input = createValidPlayerCreationInput({
    manualNote: "incorrect"
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "comprise entre 0,5 et 5"
  );
}


function testValidatePlayerInputInvalidHalfStep() {
  const input = createValidPlayerCreationInput({
    manualNote: 3.7
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "palier de 0,5"
  );
}


function testValidatePlayerInputUnknownPosition() {
  const input = createValidPlayerCreationInput({
    poste1: ["DEF", "LIBERO"]
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "Poste inconnu : LIBERO"
  );
}


function testValidatePlayerInputDuplicatedPosition() {
  const input = createValidPlayerCreationInput({
    poste1: ["DEF", "MIL"],
    poste2: ["AIL"],
    poste3: ["DEF"],
    poste4: []
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "Un poste ne peut apparaître que dans un seul niveau : DEF"
  );
}


function testValidatePlayerInputWithoutPositions() {
  const input = createValidPlayerCreationInput({
    poste1: [],
    poste2: [],
    poste3: [],
    poste4: []
  });

  const result =
    validateAndNormalizePlayerInput(input);

  assertDeepEquals(
    ["", "", "", ""],
    result.postes
  );
}


// ======================================================
// Helpers
// ======================================================

function createValidPlayerCreationInput(overrides) {
  const defaultInput = {
    name: "Alice",
    poste1: "DEF",
    poste2: "MIL",
    poste3: "AIL",
    poste4: "BUT",
    manualNote: 3.5
  };

  return Object.assign(
    {},
    defaultInput,
    overrides || {}
  );
}