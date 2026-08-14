function initializeSpreadsheet() {

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const sheetDefinitions = {
    "Players": [
      "Id",
      "Present",
      "Player",
      "Rating",
      "Position1",
      "Position2",
      "Position3",
      "Position4"
    ],
    "Notes": [
      "Id",
      "Player",
      "Defender",
      "Midfielder",
      "Winger",
      "Striker",
      "Football IQ",
      "Mental",
      "Cardio",
      "Technique",
      "Aggressiveness",
      "Communication",
      "Pressing",
      "Composure",
      "Finishing",
      "One-footed",
      "Draws the star player",
      "Poison ++",
      "Automatic rating",
      "Weighted rating",
      "Manual rating"
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

  const FIRST_BOOLEAN_COLUMN = 3; // C: Defender
  const LAST_BOOLEAN_COLUMN = 18; // R: Poison ++
  const BOOLEAN_COLUMN_COUNT = LAST_BOOLEAN_COLUMN - FIRST_BOOLEAN_COLUMN + 1;

  const PLAYER_COLUMN = 2;             // B: Player
  const AUTOMATIC_RATING_COLUMN = 19;  // S: Automatic rating
  const WEIGHTED_RATING_COLUMN = 20;   // T: Weighted rating

  /*
   * Row 1: weights.
   * Put 1 above columns C through R.
   */
  const weights = new Array(BOOLEAN_COLUMN_COUNT).fill(1);

  sheet.getRange(1, FIRST_BOOLEAN_COLUMN, 1, BOOLEAN_COLUMN_COUNT).setValues([weights]);

  /*
   * Checkboxes from C3 through R on all available rows.
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
   * Notes.Player formula.
   *
   * Apps Script formulas are written in English, even when the spreadsheet
   * uses another locale.
   */
  const playerFormula =
    '=IFERROR(INDEX(Players!$C:$C,MATCH(A3,Players!$A:$A,0)),"")';

  /*
   * Unweighted automatic rating.
   */
  const automaticRatingFormula =
    '=IF(A3="","",' +
    'MAX(0.5,' +
    'ROUND((' +
    'COUNTIFS(C3:R3,TRUE,C$1:R$1,">0")' +
    '/COUNTIF(C$1:R$1,">0")' +
    '*5)*2)/2' +
    ')' +
    ')';

  /*
   * Weighted automatic rating.
   */
  const weightedRatingFormula =
    '=IF(A3="","",' +
    'MAX(0.5,' +
    'ROUND((' +
    'SUMPRODUCT(C3:R3,C$1:R$1)' +
    '/SUMIF(C$1:R$1,">0")' +
    '*5)*2)/2' +
    ')' +
    ')';

  /*
   * Place formulas on the first data row, then fill them down.
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
    AUTOMATIC_RATING_COLUMN,
    MAX_DATA_ROWS,
    automaticRatingFormula
  );

  setFormulaForColumn(
    sheet,
    FIRST_DATA_ROW,
    WEIGHTED_RATING_COLUMN,
    MAX_DATA_ROWS,
    weightedRatingFormula
  );

  /*
   * Rows 1 and 2 remain visible while scrolling.
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