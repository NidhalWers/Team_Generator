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
        ["1", "Alice", 4],
        ["2", "Bob", 3.5]
      ]);

    /*
     * headerIndex est indexé à partir de zéro.
     * La ligne 2 correspond donc à headerIndex = 1.
     */
    const result = getSheetData(sheetName, 1);

    assertDeepEquals(
      [
        {
          Id: "1",
          Joueur: "Alice",
          Note: 4
        },
        {
          Id: "2",
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
        ["42", "Valeur à ignorer", "Alice"]
      ]);

    const result = getSheetData(sheetName, 0);

    assertDeepEquals(
      [
        {
          Id: "42",
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