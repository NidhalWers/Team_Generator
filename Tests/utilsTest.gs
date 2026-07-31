/**
 * Entry point for the test suite for utils.gs.
 *
 * Run from the Apps Script editor.
 */
function runUtilsTests() {
  return runTestSuite("utils.gs", [
    {
      name: "normalizeString converts a number to text",
      test: testnormalizeStringWithNumber
    },
    {
      name: "normalizeString trims whitespace",
      test: testnormalizeStringTrimsValue
    },
    {
      name: "normalizeString turns null into an empty string",
      test: testnormalizeStringWithNull
    },
    {
      name: "getStandardDeviation calculates the standard deviation of a series",
      test: testGetStandardDeviation
    },
    {
      name: "getStandardDeviation returns 0 for identical values",
      test: testGetStandardDeviationWithIdenticalValues
    },
    {
      name: "getStandardDeviation returns 0 for a single value",
      test: testGetStandardDeviationWithSingleValue
    },
    {
      name: "shuffleArray returns the same array",
      test: testShuffleArrayReturnsSameArray
    },
    {
      name: "shuffleArray preserves all elements",
      test: testShuffleArrayPreservesElements
    },
    {
      name: "shuffleArray can be tested with deterministic randomness",
      test: testShuffleArrayWithDeterministicRandom
    },
    {
      name: "getSheetData uses the correct header row",
      test: testGetSheetData
    },
    {
      name: "getSheetData ignores columns without a header",
      test: testGetSheetDataIgnoresEmptyHeaders
    },
    {
      name: "isHalfStep accepts 0.5 increments",
      test: testIsHalfStepAcceptsHalfSteps
    },
    {
      name: "isHalfStep rejects values outside the increment",
      test: testIsHalfStepRejectsInvalidSteps
    },
    {
      name: "getDuplicatedValues returns an empty array without duplicates",
      test: testGetDuplicatedValuesWithoutDuplicates
    },
    {
      name: "getDuplicatedValues returns duplicated values",
      test: testGetDuplicatedValues
    },
    {
      name: "getDuplicatedValues returns each duplicate only once",
      test: testGetDuplicatedValuesOnlyOnce
    },
    {
      name: "columnNumberToLetter converts single-letter columns",
      test: testColumnNumberToLetterSingleLetters
    },
    {
      name: "columnNumberToLetter converts multi-letter columns",
      test: testColumnNumberToLetterMultipleLetters
    }
  ]);
}


// ======================================================
// normalizeString
// ======================================================

function testnormalizeStringWithNumber() {
  const result = normalizeString(42);

  assertEquals("42", result);
}


function testnormalizeStringTrimsValue() {
  const result = normalizeString("  PLAYER-42  ");

  assertEquals("PLAYER-42", result);
}


function testnormalizeStringWithNull() {
  assertEquals("", normalizeString(null));
  assertEquals("", normalizeString(undefined));
}


// ======================================================
// getStandardDeviation
// ======================================================

function testGetStandardDeviation() {
  /*
   * Standard series where:
   * - the mean is 5;
   * - the population variance is 4;
   * - the standard deviation is 2.
   */
  const values = [2, 4, 4, 4, 5, 5, 7, 9];

  const result = getStandardDeviation(values);

  assertAlmostEquals(2, result);
}


function testGetStandardDeviationWithIdenticalValues() {
  const result = getStandardDeviation([3.5, 3.5, 3.5]);

  assertAlmostEquals(0, result);
}


function testGetStandardDeviationWithSingleValue() {
  const result = getStandardDeviation([4.5]);

  assertAlmostEquals(0, result);
}


// ======================================================
// shuffleArray
// ======================================================

function testShuffleArrayReturnsSameArray() {
  const original = ["A", "B", "C"];

  const result = shuffleArray(original, () => 0.5);

  assertTrue(
    result === original,
    "shuffleArray must modify and return the input array."
  );
}


function testShuffleArrayPreservesElements() {
  const original = ["A", "B", "C", "D"];
  const result = shuffleArray([...original]);

  assertEquals(original.length, result.length);

  assertDeepEquals(
    [...original].sort(),
    [...result].sort(),
    "Shuffling must neither add nor remove elements."
  );
}


function testShuffleArrayWithDeterministicRandom() {
  /*
   * For [A, B, C]:
   *
   * i = 2, random = 0
   * j = floor(0 × 3) = 0
   * => [C, B, A]
   *
   * i = 1, random = 0
   * j = floor(0 × 2) = 0
   * => [B, C, A]
   */
  const result = shuffleArray(
    ["A", "B", "C"],
    () => 0
  );

  assertDeepEquals(
    ["B", "C", "A"],
    result
  );
}


// ======================================================
// getSheetData
// ======================================================

function testGetSheetData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = createTemporaryTestSheetName();

  const sheet = spreadsheet.insertSheet(sheetName);

  try {
    sheet
      .getRange(1, 1, 4, 3)
      .setValues([
        ["Ignored information", "", ""],
        ["Id", "Player", "Rating"],
        ["first_id", "Alice", 4],
        ["second_id", "Bob", 3.5]
      ]);

    /*
     * headerIndex is zero-based.
     * Row 2 therefore corresponds to headerIndex = 1.
     */
    const result = getSheetData(sheetName, 1);

    assertDeepEquals(
      [
        {
          Id: "first_id",
          Player: "Alice",
          Rating: 4
        },
        {
          Id: "second_id",
          Player: "Bob",
          Rating: 3.5
        }
      ],
      result
    );
  } finally {
    spreadsheet.deleteSheet(sheet);
  }
}


function testGetSheetDataIgnoresEmptyHeaders() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = createTemporaryTestSheetName();

  const sheet = spreadsheet.insertSheet(sheetName);

  try {
    sheet
      .getRange(1, 1, 2, 3)
      .setValues([
        ["Id", "", "Player"],
        ["id_whatever", "Value to ignore", "Alice"]
      ]);

    const result = getSheetData(sheetName, 0);

    assertDeepEquals(
      [
        {
          Id: "id_whatever",
          Player: "Alice"
        }
      ],
      result
    );
  } finally {
    spreadsheet.deleteSheet(sheet);
  }
}


// ======================================================
// Test helpers
// ======================================================

function createTemporaryTestSheetName() {
  return `__TEST_UTILS_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// ======================================================
// isHalfStep
// ======================================================

function testIsHalfStepAcceptsHalfSteps() {
  const validValues = [
    0.5,
    1,
    1.5,
    2,
    2.5,
    3,
    3.5,
    4,
    4.5,
    5
  ];

  validValues.forEach(value => {
    assertTrue(
      isHalfStep(value),
      `${value} must be recognized as a 0.5 increment.`
    );
  });
}


function testIsHalfStepRejectsInvalidSteps() {
  const invalidValues = [
    0.1,
    0.3,
    1.2,
    2.25,
    3.7,
    4.9
  ];

  invalidValues.forEach(value => {
    assertTrue(
      !isHalfStep(value),
      `${value} must not be recognized as a 0.5 increment.`
    );
  });
}


// ======================================================
// getDuplicatedValues
// ======================================================

function testGetDuplicatedValuesWithoutDuplicates() {
  assertDeepEquals(
    [],
    getDuplicatedValues([])
  );

  assertDeepEquals(
    [],
    getDuplicatedValues([
      "G",
      "DEF",
      "MIL",
      "AIL",
      "BUT"
    ])
  );
}


function testGetDuplicatedValues() {
  const result = getDuplicatedValues([
    "DEF",
    "MIL",
    "DEF",
    "AIL",
    "AIL"
  ]);

  assertDeepEquals(
    ["DEF", "AIL"],
    result
  );
}


function testGetDuplicatedValuesOnlyOnce() {
  const result = getDuplicatedValues([
    "DEF",
    "DEF",
    "DEF",
    "MIL"
  ]);

  assertDeepEquals(
    ["DEF"],
    result,
    "A duplicate must be returned only once, even with three occurrences."
  );
}


// ======================================================
// columnNumberToLetter
// ======================================================

function testColumnNumberToLetterSingleLetters() {
  assertEquals("A", columnNumberToLetter(1));
  assertEquals("B", columnNumberToLetter(2));
  assertEquals("Z", columnNumberToLetter(26));
}


function testColumnNumberToLetterMultipleLetters() {
  const cases = [
    { column: 27, expected: "AA" },
    { column: 28, expected: "AB" },
    { column: 52, expected: "AZ" },
    { column: 53, expected: "BA" },
    { column: 702, expected: "ZZ" },
    { column: 703, expected: "AAA" }
  ];

  cases.forEach(testCase => {
    assertEquals(
      testCase.expected,
      columnNumberToLetter(testCase.column),
      `Incorrect conversion for column ${testCase.column}.`
    );
  });
}
