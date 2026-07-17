function initializeSpreadsheet() {

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const sheetDefinitions = {
    "Joueurs": [
      "Id",
      "Présent",
      "Joueur",
      "Note",
      "Poste1",
      "Poste2",
      "Poste3",
      "Poste4"
    ],
    "Notes": [
      "Id",
      "Joueur",
      "Défenseur",
      "Milieu",
      "Ailier",
      "Buteur",
      "QI Foot",
      "Mental",
      "Cardio",
      "Technique",
      "Aggressivité",
      "Communication",
      "Pressing",
      "Sang froid",
      "Finisseur",
      "Un seul pied",
      "Attire Poison",
      "Poison ++",
      "Note automatique",
      "Note pondérée",
      "Note manuelle"
    ]
  };

  let createdSheetCount = 0;

  for (const [sheetName, headers] of Object.entries(sheetDefinitions)) {

    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      createdSheetCount++;
    }

    const lastColumn = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();

    const isEmpty =
      lastRow === 0 ||
      (lastRow === 1 &&
       lastColumn === 1 &&
       sheet.getRange(1, 1).getValue() === "");

    if (isEmpty === true) {
      const headerRow = sheetName === "Notes" ? 2 : 1;
      
      sheet
        .getRange(headerRow, 1, 1, headers.length)
        .setValues([headers]);

      customSheetInitialization(sheet, sheetName);
    }
  }

  if (createdSheetCount === 0) {
    throw new Error(
      "All required sheets already exist."
    );
  }
}

function customSheetInitialization(sheet, sheetName){
  switch (sheetName){
    case "Notes":{
      initializeNotesSheet(sheet);
      break;
    }
    default: break;
  }
}

function initializeNotesSheet(sheet) {
  const FIRST_DATA_ROW = 3;
  const MAX_DATA_ROWS = sheet.getMaxRows() - FIRST_DATA_ROW + 1;

  const FIRST_BOOLEAN_COLUMN = 3; // C : Défenseur
  const LAST_BOOLEAN_COLUMN = 18; // R : Poison ++
  const BOOLEAN_COLUMN_COUNT = LAST_BOOLEAN_COLUMN - FIRST_BOOLEAN_COLUMN + 1;

  const PLAYER_COLUMN = 2;           // B : Joueur
  const AUTOMATIC_NOTE_COLUMN = 19;  // S : Note automatique
  const WEIGHTED_NOTE_COLUMN = 20;   // T : Note pondérée

  /*
   * Ligne 1 : pondérations.
   * On met 1 au-dessus des colonnes C à R.
   */
  const weights = new Array(BOOLEAN_COLUMN_COUNT).fill(1);

  sheet.getRange(1, FIRST_BOOLEAN_COLUMN, 1, BOOLEAN_COLUMN_COUNT).setValues([weights]);

  /*
   * Cases à cocher de C3 à R sur toutes les lignes disponibles.
   */
  if (MAX_DATA_ROWS > 0) {
    sheet
      .getRange(
        FIRST_DATA_ROW,
        FIRST_BOOLEAN_COLUMN,
        MAX_DATA_ROWS,
        BOOLEAN_COLUMN_COUNT
      )
      .insertCheckboxes();
  }

  /*
   * Formule Notes.Joueur.
   *
   * La formule utilisée dans Apps Script est écrite en anglais,
   * même lorsque le spreadsheet est configuré en français.
   */
  const playerFormula =
    '=IFERROR(INDEX(Joueurs!$C:$C,MATCH(A3,Joueurs!$A:$A,0)),"")';

  /*
   * Note automatique non pondérée.
   */
  const automaticNoteFormula =
    '=IF(A3="","",' +
    'MAX(0.5,' +
    'ROUND((' +
    'COUNTIFS(C3:R3,TRUE,C$1:R$1,">0")' +
    '/COUNTIF(C$1:R$1,">0")' +
    '*5)*2)/2' +
    ')' +
    ')';

  /*
   * Note automatique pondérée.
   */
  const weightedNoteFormula =
    '=IF(A3="","",' +
    'MAX(0.5,' +
    'ROUND((' +
    'SUMPRODUCT(C3:R3,C$1:R$1)' +
    '/SUMIF(C$1:R$1,">0")' +
    '*5)*2)/2' +
    ')' +
    ')';

  /*
   * On place les formules sur la première ligne de données,
   * puis on les recopie vers le bas.
   */
  setFormulaForColumn(
    sheet,
    FIRST_DATA_ROW,
    PLAYER_COLUMN,
    MAX_DATA_ROWS,
    playerFormula
  );

  setFormulaForColumn(
    sheet,
    FIRST_DATA_ROW,
    AUTOMATIC_NOTE_COLUMN,
    MAX_DATA_ROWS,
    automaticNoteFormula
  );

  setFormulaForColumn(
    sheet,
    FIRST_DATA_ROW,
    WEIGHTED_NOTE_COLUMN,
    MAX_DATA_ROWS,
    weightedNoteFormula
  );

  /*
   * Les lignes 1 et 2 restent visibles pendant le défilement.
   */
  sheet.setFrozenRows(2);
}

function setFormulaForColumn(sheet, firstDataRow, column, rowCount, formula) {
  if (rowCount <= 0) {
    return;
  }

  const firstCell = sheet.getRange(
    firstDataRow,
    column
  );

  firstCell.setFormula(formula);

  if (rowCount === 1) {
    return;
  }

  const fullRange = sheet.getRange(
    firstDataRow,
    column,
    rowCount,
    1
  );

  firstCell.autoFill(
    fullRange,
    SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES
  );
}
