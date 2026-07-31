/**
 * Entry point for the tests for playerCreationService.gs.
 */
function runPlayerCreationServiceTests() {
  return runTestSuite(
    "playerCreationService.gs",
    [
      // normalizePositionCell
      {
        name: "normalizePositionCell returns an empty string when no value is provided",
        test: testNormalizePositionCellWithEmptyValue
      },
      {
        name: "normalizePositionCell normalizes a simple string",
        test: testNormalizePositionCellWithString
      },
      {
        name: "normalizePositionCell normalizes multiple positions in a string",
        test: testNormalizePositionCellWithMultipleStringValues
      },
      {
        name: "normalizePositionCell normalizes an array of positions",
        test: testNormalizePositionCellWithArray
      },
      {
        name: "normalizePositionCell ignores empty values",
        test: testNormalizePositionCellIgnoresEmptyValues
      },

      // validateAndNormalizePlayerInput
      {
        name: "validateAndNormalizePlayerInput normalizes valid input",
        test: testValidatePlayerInputValidInput
      },
      {
        name: "validateAndNormalizePlayerInput accepts multiple positions per level",
        test: testValidatePlayerInputWithMultiplePositions
      },
      {
        name: "validateAndNormalizePlayerInput rejects missing input",
        test: testValidatePlayerInputMissingInput
      },
      {
        name: "validateAndNormalizePlayerInput rejects an empty name",
        test: testValidatePlayerInputEmptyName
      },
      {
        name: "validateAndNormalizePlayerInput trims the name",
        test: testValidatePlayerInputTrimsName
      },
      {
        name: "validateAndNormalizePlayerInput rejects a rating below 0.5",
        test: testValidatePlayerInputRatingTooLow
      },
      {
        name: "validateAndNormalizePlayerInput rejects a rating above 5",
        test: testValidatePlayerInputRatingTooHigh
      },
      {
        name: "validateAndNormalizePlayerInput rejects a non-numeric rating",
        test: testValidatePlayerInputInvalidRating
      },
      {
        name: "validateAndNormalizePlayerInput rejects a rating outside 0.5 increments",
        test: testValidatePlayerInputInvalidHalfStep
      },
      {
        name: "validateAndNormalizePlayerInput rejects an unknown position",
        test: testValidatePlayerInputUnknownPosition
      },
      {
        name: "validateAndNormalizePlayerInput rejects a position present in multiple levels",
        test: testValidatePlayerInputDuplicatedPosition
      },
      {
        name: "validateAndNormalizePlayerInput accepts no positions",
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
      manualRating: 3.5,
      positions: [
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
    position1: ["DEF", "MIL"],
    position2: ["AIL"],
    position3: ["BUT"],
    position4: []
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
    result.positions
  );
}


function testValidatePlayerInputMissingInput() {
  assertThrows(
    () => validateAndNormalizePlayerInput(null),
    "Player information is missing"
  );
}


function testValidatePlayerInputEmptyName() {
  const input = createValidPlayerCreationInput({
    name: "   "
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "The player name is required"
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


function testValidatePlayerInputRatingTooLow() {
  const input = createValidPlayerCreationInput({
    manualRating: 0
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "between 0.5 and 5"
  );
}


function testValidatePlayerInputRatingTooHigh() {
  const input = createValidPlayerCreationInput({
    manualRating: 5.5
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "between 0.5 and 5"
  );
}


function testValidatePlayerInputInvalidRating() {
  const input = createValidPlayerCreationInput({
    manualRating: "incorrect"
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "between 0.5 and 5"
  );
}


function testValidatePlayerInputInvalidHalfStep() {
  const input = createValidPlayerCreationInput({
    manualRating: 3.7
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "increments of 0.5"
  );
}


function testValidatePlayerInputUnknownPosition() {
  const input = createValidPlayerCreationInput({
    position1: ["DEF", "LIBERO"]
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "Unknown position: LIBERO"
  );
}


function testValidatePlayerInputDuplicatedPosition() {
  const input = createValidPlayerCreationInput({
    position1: ["DEF", "MIL"],
    position2: ["AIL"],
    position3: ["DEF"],
    position4: []
  });

  assertThrows(
    () => validateAndNormalizePlayerInput(input),
    "A position may appear in only one level: DEF"
  );
}


function testValidatePlayerInputWithoutPositions() {
  const input = createValidPlayerCreationInput({
    position1: [],
    position2: [],
    position3: [],
    position4: []
  });

  const result =
    validateAndNormalizePlayerInput(input);

  assertDeepEquals(
    ["", "", "", ""],
    result.positions
  );
}


// ======================================================
// Helpers
// ======================================================

function createValidPlayerCreationInput(overrides) {
  const defaultInput = {
    name: "Alice",
    position1: "DEF",
    position2: "MIL",
    position3: "AIL",
    position4: "BUT",
    manualRating: 3.5
  };

  return Object.assign(
    {},
    defaultInput,
    overrides || {}
  );
}
