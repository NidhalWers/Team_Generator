/**
 * Point d'entrée de la suite de tests de utils.gs.
 *
 * À exécuter depuis l'éditeur Apps Script.
 */
function runUtilsTests() {
  return runTestSuite("utils.gs", [
    {
      name: "normalizeString convertit un nombre en texte",
      test: testnormalizeStringWithNumber
    },
    {
      name: "normalizeString retire les espaces",
      test: testnormalizeStringTrimsValue
    },
    {
      name: "normalizeString transforme null en chaîne vide",
      test: testnormalizeStringWithNull
    },
    {
      name: "getStandardDeviation calcule l'écart-type d'une série",
      test: testGetStandardDeviation
    },
    {
      name: "getStandardDeviation retourne 0 pour des valeurs identiques",
      test: testGetStandardDeviationWithIdenticalValues
    },
    {
      name: "getStandardDeviation retourne 0 pour une seule valeur",
      test: testGetStandardDeviationWithSingleValue
    },
    {
      name: "shuffleArray retourne le même tableau",
      test: testShuffleArrayReturnsSameArray
    },
    {
      name: "shuffleArray conserve tous les éléments",
      test: testShuffleArrayPreservesElements
    },
    {
      name: "shuffleArray peut être testé avec un hasard déterministe",
      test: testShuffleArrayWithDeterministicRandom
    },
    {
      name: "getSheetData utilise la bonne ligne d'en-têtes",
      test: testGetSheetData
    },
    {
      name: "getSheetData ignore les colonnes sans en-tête",
      test: testGetSheetDataIgnoresEmptyHeaders
    },
    {
      name: "isHalfStep accepte les paliers de 0,5",
      test: testIsHalfStepAcceptsHalfSteps
    },
    {
      name: "isHalfStep refuse les valeurs hors palier",
      test: testIsHalfStepRejectsInvalidSteps
    },
    {
      name: "getDuplicatedValues retourne un tableau vide sans doublon",
      test: testGetDuplicatedValuesWithoutDuplicates
    },
    {
      name: "getDuplicatedValues retourne les valeurs dupliquées",
      test: testGetDuplicatedValues
    },
    {
      name: "getDuplicatedValues ne retourne chaque doublon qu'une fois",
      test: testGetDuplicatedValuesOnlyOnce
    },
    {
      name: "columnNumberToLetter convertit les colonnes simples",
      test: testColumnNumberToLetterSingleLetters
    },
    {
      name: "columnNumberToLetter convertit les colonnes multiples",
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
   * Série classique dont :
   * - la moyenne vaut 5 ;
   * - la variance de population vaut 4 ;
   * - l'écart-type vaut 2.
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
    "shuffleArray doit modifier et retourner le tableau reçu."
  );
}


function testShuffleArrayPreservesElements() {
  const original = ["A", "B", "C", "D"];
  const result = shuffleArray([...original]);

  assertEquals(original.length, result.length);

  assertDeepEquals(
    [...original].sort(),
    [...result].sort(),
    "Le mélange ne doit ni ajouter ni supprimer d'élément."
  );
}


function testShuffleArrayWithDeterministicRandom() {
  /*
   * Pour [A, B, C] :
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
        ["Information ignorée", "", ""],
        ["Id", "Joueur", "Note"],
        ["first_id", "Alice", 4],
        ["second_id", "Bob", 3.5]
      ]);

    /*
     * headerIndex est indexé à partir de zéro.
     * La ligne 2 correspond donc à headerIndex = 1.
     */
    const result = getSheetData(sheetName, 1);

    assertDeepEquals(
      [
        {
          Id: "first_id",
          Joueur: "Alice",
          Note: 4
        },
        {
          Id: "second_id",
          Joueur: "Bob",
          Note: 3.5
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
        ["Id", "", "Joueur"],
        ["id_whatever", "Valeur à ignorer", "Alice"]
      ]);

    const result = getSheetData(sheetName, 0);

    assertDeepEquals(
      [
        {
          Id: "id_whatever",
          Joueur: "Alice"
        }
      ],
      result
    );
  } finally {
    spreadsheet.deleteSheet(sheet);
  }
}


// ======================================================
// Helpers de tests
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
      `${value} doit être reconnu comme un palier de 0,5.`
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
      `${value} ne doit pas être reconnu comme un palier de 0,5.`
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
    "Un doublon doit être retourné une seule fois, même avec trois occurrences."
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
      `Conversion incorrecte pour la colonne ${testCase.column}.`
    );
  });
}