const PLAYER_SHEET_NAME = "Players";
const NOTES_SHEET_NAME = "Notes";

const PLAYER_HEADERS_ROW = 1;
const NOTES_HEADERS_ROW = 2;

const MANUAL_RATING_HEADER = "Manual rating (legacy format)";

const PLAYER_POSITION_VALUES = [
  "G",
  "DEF",
  "MIL",
  "AIL",
  "BUT"
];


/**
 * Adds a player to the Players and Notes sheets.
 *
 * @param {{
 *   name: string,
 *   position1: string,
 *   position2: string,
 *   position3: string,
 *   position4: string,
 *   manualRating: number
 * }} playerInput
 *
 * @return {{
 *   success: boolean,
 *   player: {
 *     id: string,
 *     name: string
 *   }
 * }}
 */
function addPlayer(playerInput, adminToken) {
  const lock = LockService.getDocumentLock();

  try {
    lock.waitLock(10000);

    const admin = isAdminSession(adminToken);
    const requestedRatingChange = hasManualNote_(playerInput);

    if (requestedRatingChange && !admin) {
      throw new Error("Session administrateur invalide ou expirée.");
    }

    const inputToValidate = {
      ...playerInput,

      manualNote: admin ? playerInput.manualNote : 2.5
    };

    const normalizedInput = validateAndNormalizePlayerInput(inputToValidate);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const playersSheet = spreadsheet.getSheetByName(PLAYER_SHEET_NAME);
    const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET_NAME);

    if (!playersSheet || !notesSheet) {
      throw new Error('The "Players" and "Notes" sheets must be initialized.');
    }

    const playerHeaderMap = getSheetHeaderMap(playersSheet, PLAYER_HEADERS_ROW);
    const notesHeaderMap = getSheetHeaderMap(notesSheet, NOTES_HEADERS_ROW);

    const playerId = generateNextPlayerId(playersSheet, notesSheet, playerHeaderMap, notesHeaderMap);

    const playerRow = appendPlayerRow(playersSheet, playerHeaderMap, playerId, normalizedInput);

    try {
      appendNotesRow(notesSheet, notesHeaderMap, playerId, normalizedInput.manualRating);
    } catch (error) {
      /*
       * If writing to Notes fails, remove the Players row to keep the two
       * sheets synchronized.
       */
      playersSheet.deleteRow(playerRow);
      throw error;
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      player: {
        id: String(playerId),
        name: normalizedInput.name
      }
    };

  } finally {
    lock.releaseLock();
  }
}


/**
 * Validates and normalizes data received from the web app.
 */
function validateAndNormalizePlayerInput(playerInput) {
  if (!playerInput) {
    throw new Error("Player information is missing.");
  }

  const name = String(playerInput.name || "").trim();

  if (!name) {
    throw new Error("The player name is required.");
  }

  const manualRating = Number(playerInput.manualRating);

  if (!Number.isFinite(manualRating) || manualRating < 0.5 || manualRating > 5) {
    throw new Error("The manual rating must be between 0.5 and 5.");
  }

  if (!isHalfStep(manualRating)) {
    throw new Error("The manual rating must use increments of 0.5.");
  }

  const positions = [
    normalizePositionCell(playerInput.position1),
    normalizePositionCell(playerInput.position2),
    normalizePositionCell(playerInput.position3),
    normalizePositionCell(playerInput.position4)
  ];

  const allPositions = positions.flatMap(positionCell => positionCell ? positionCell.split(",") : []);

  const invalidPositions = allPositions.filter(position => !PLAYER_POSITION_VALUES.includes(position));

  if (invalidPositions.length > 0) {
    throw new Error(`Unknown position: ${invalidPositions.join(", ")}.`);
  }

  const duplicatedPositions = getDuplicatedValues(allPositions);

  if (duplicatedPositions.length > 0) {
    throw new Error("A position may appear in only one level: " + duplicatedPositions.join(", ") + ".");
  }

  return {
    name,
    manualRating,
    positions
  };
}


function normalizePositionCell(value) {
  if (!value) {
    return "";
  }

  const positions = Array.isArray(value)
    ? value
    : String(value).split(",");

  return positions
    .filter(value => value !== "" && value !== null)
    .map(position => String(position).trim().toUpperCase())
    .filter(Boolean)
    .join(",");
}

/**
 * The ID is numeric and unique across both sheets.
 */
function generateNextPlayerId(playersSheet, notesSheet, playerHeaderMap, notesHeaderMap) {
  const playerIds = readNumericColumnValues(playersSheet, PLAYER_HEADERS_ROW + 1, playerHeaderMap.Id);

  const notesIds = readNumericColumnValues(notesSheet, NOTES_HEADERS_ROW + 1, notesHeaderMap.Id);

  const allIds = [...playerIds, ...notesIds];

  if (allIds.length === 0) {
    return 1;
  }

  return Math.max(...allIds) + 1;
}

/**
 * Adds the row to Players.
 */
function appendPlayerRow(sheet, headerMap, playerId, input) {
  const rowNumber = Math.max(sheet.getLastRow() + 1, PLAYER_HEADERS_ROW + 1);

  const row = new Array(sheet.getLastColumn()).fill("");

  row[headerMap["Present"] - 1] = false;
  row[headerMap["Player"] - 1] = input.name;
  row[headerMap["Position1"] - 1] = input.positions[0];
  row[headerMap["Position2"] - 1] = input.positions[1];
  row[headerMap["Position3"] - 1] = input.positions[2];
  row[headerMap["Position4"] - 1] = input.positions[3];
  row[headerMap["Id"] - 1] = playerId;

  sheet
    .getRange(rowNumber, 1, 1, row.length)
    .setValues([row]);

  // Players.Rating references the manual rating in Notes.
  setPlayerRatingFormula(sheet, rowNumber, headerMap["Rating"], headerMap["Id"]);

  return rowNumber;
}


/**
 * Writes Players.Rating using a formula independent of column order in both
 * sheets.
 */
function setPlayerRatingFormula(playersSheet, rowNumber, ratingColumn, idColumn) {
  const notesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOTES_SHEET_NAME);
  const notesHeaders = getSheetHeaderMap(notesSheet, NOTES_HEADERS_ROW);

  const notesIdColumn = notesHeaders["Id"];
  const manualRatingColumn = notesHeaders["Manual rating (legacy format)"];

  const playerIdAddress = playersSheet.getRange(rowNumber, idColumn).getA1Notation();

  const notesIdRange =`${NOTES_SHEET_NAME}!$${columnNumberToLetter(notesIdColumn)}
    :$${columnNumberToLetter(notesIdColumn)}`;

  const manualRatingRange =`${NOTES_SHEET_NAME}!$${columnNumberToLetter(manualRatingColumn)}
    :$${columnNumberToLetter(manualRatingColumn)}`;

  const formula = [
    `=INDEX(${manualRatingRange};`,
    ` MATCH(${playerIdAddress};${notesIdRange};0))`
  ].join("");

  playersSheet
    .getRange(rowNumber, ratingColumn)
    .setFormula(formula);
}

function appendNotesRow(sheet, headerMap, playerId, manualRating) {
  const rowNumber = Math.max(sheet.getLastRow() + 1, NOTES_HEADERS_ROW + 1);

  const row = new Array(sheet.getLastColumn()).fill("");

  row[headerMap["Id"] - 1] = playerId;

  /*
   * All columns between Defender and Poison ++ are initialized to false.
   */
  const firstBooleanColumn = headerMap["Defender"];
  const lastBooleanColumn = headerMap["Poison ++"];

  for (let column = firstBooleanColumn; column <= lastBooleanColumn; column++) {
    row[column - 1] = false;
  }

  row[headerMap["Manual rating (legacy format)"] - 1] = manualRating;

  sheet
    .getRange(rowNumber, 1, 1, row.length)
    .setValues([row]);

  setNotesPlayerNameFormula(sheet, rowNumber,headerMap["Player"]);

  setNotesAutomaticFormula(sheet, rowNumber, headerMap["Automatic rating (out of 5)"], firstBooleanColumn, lastBooleanColumn);

  setNotesWeightedFormula(sheet, rowNumber, headerMap["Weighted automatic rating"], firstBooleanColumn, lastBooleanColumn);

  return rowNumber;
}


function setNotesPlayerNameFormula(notesSheet, rowNumber, playerNameColumn) {
  const playersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PLAYER_SHEET_NAME);

  const playerHeaders = getSheetHeaderMap(playersSheet, PLAYER_HEADERS_ROW);

  const idCell = notesSheet.getRange(rowNumber, 1).getA1Notation();

  const playersNameRange =
    `${PLAYER_SHEET_NAME}!$${
      columnNumberToLetter(playerHeaders["Player"])
    }:$${
      columnNumberToLetter(playerHeaders["Player"])
    }`;

  const playersIdRange =
    `${PLAYER_SHEET_NAME}!$${
      columnNumberToLetter(playerHeaders["Id"])
    }:$${
      columnNumberToLetter(playerHeaders["Id"])
    }`;

  const formula =[
    `=INDEX(${playersNameRange};`,
    ` MATCH(${idCell};${playersIdRange};0))`
    ].join("");

  notesSheet
    .getRange(rowNumber, playerNameColumn
    )
    .setFormula(formula);
}


function setNotesAutomaticFormula(sheet, rowNumber, formulaColumn, firstBooleanColumn, lastBooleanColumn) {
  const rowCriteriaRange =
    `${columnNumberToLetter(firstBooleanColumn)}` +
    `${rowNumber}:` +
    `${columnNumberToLetter(lastBooleanColumn)}` +
    `${rowNumber}`;

  const weightRange =
    `${columnNumberToLetter(firstBooleanColumn)}$1:` +
    `${columnNumberToLetter(lastBooleanColumn)}$1`;

  const formula = [
    `= MAX(0,5;`,
    `ROUND((`,
    `COUNTIFS(${rowCriteriaRange};`,
      `TRUE;${weightRange};">0")`,
    `/COUNTIF(${weightRange};">0")*5)*2)/2)`,
    ].join("");

  sheet
    .getRange(rowNumber, formulaColumn)
    .setFormula(formula);
}


function setNotesWeightedFormula(sheet, rowNumber, formulaColumn, firstBooleanColumn, lastBooleanColumn) {
  const rowCriteriaRange =
    `${columnNumberToLetter(firstBooleanColumn)}` +
    `${rowNumber}:` +
    `${columnNumberToLetter(lastBooleanColumn)}` +
    `${rowNumber}`;

  const weightRange =
    `${columnNumberToLetter(firstBooleanColumn)}$1:` +
    `${columnNumberToLetter(lastBooleanColumn)}$1`;

  const formula = [
    `= MAX(0,5;`, 
    `ROUND((`,
    `SUMPRODUCT(${rowCriteriaRange};${weightRange})`,
    `/SUMIF(${weightRange};">0")*5)`,
    `*2)/2)`
    ].join("");

  sheet
    .getRange(rowNumber, formulaColumn)
    .setFormula(formula);
}

/**
 * Returns all editable information for one player.
 */
function getPlayerById(playerId, adminToken) {
  const admin = isAdminSession(adminToken);
  const normalizedId = normalizePlayerIdForEdition(playerId);

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const playerSheet = spreadsheet.getSheetByName(PLAYER_SHEET_NAME);

  const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET_NAME);

  if (!playerSheet || !notesSheet) {
    throw new Error("The Players or Notes sheets could not be found.");
  }

  const playerHeaders = getSheetHeaderMap(playerSheet, PLAYER_HEADERS_ROW);

  const notesHeaders = getSheetHeaderMap(notesSheet, NOTES_HEADERS_ROW);

  const playerRow = findPlayerRowById(playerSheet, playerHeaders["Id"], PLAYER_HEADERS_ROW + 1, normalizedId);

  const notesRow = findPlayerRowById(notesSheet, notesHeaders["Id"], NOTES_HEADERS_ROW + 1, normalizedId);

  if (!playerRow || !notesRow) {
    throw new Error(`Player not found: ${normalizedId}`);
  }

  let result = {
    id: normalizedId,

    name: String(playerSheet.getRange(playerRow, playerHeaders["Player"]).getValue() || ""),

    position1: splitPositionCell(playerSheet.getRange(playerRow,playerHeaders["Position1"]).getValue()),
    position2: splitPositionCell(playerSheet.getRange(playerRow,playerHeaders["Position2"]).getValue()),
    position3: splitPositionCell(playerSheet.getRange(playerRow,playerHeaders["Position3"]).getValue()),
    position4: splitPositionCell(playerSheet.getRange(playerRow,playerHeaders["Position4"]).getValue())
  };

  if (admin){
    result.manualRating = Number(notesSheet.getRange(notesRow, notesHeaders[MANUAL_RATING_HEADER]).getValue())
  }

  return result;
}

/**
 * Updates an existing player in Players and Notes.
 */
function updatePlayer(playerInput, adminToken) {
  const lock = LockService.getDocumentLock();

  lock.waitLock(30000);

  let previousValues = null;

  try {
    if (!playerInput) {
      throw new Error("Player information is missing.");
    }

    const admin = isAdminSession(adminToken);
    const requestedRatingChange = hasManualNote_(playerInput);

    if (requestedRatingChange && !admin) {
      throw new Error("Session administrateur invalide ou expirée.");
    }

    const playerId = normalizePlayerIdForEdition(playerInput.id);

    const inputToValidate = {
      ...playerInput,

      manualNote:
        admin
          ? playerInput.manualNote
          : 2.5
    };

    const normalizedInput = validateAndNormalizePlayerInput(inputToValidate);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    const playerSheet = spreadsheet.getSheetByName(PLAYER_SHEET_NAME);

    const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET_NAME);

    if (!playerSheet || !notesSheet) {
      throw new Error("The Players or Notes sheets could not be found.");
    }

    const playerHeaders = getSheetHeaderMap(playerSheet, PLAYER_HEADERS_ROW);

    const notesHeaders = getSheetHeaderMap(notesSheet, NOTES_HEADERS_ROW);

    const playerRow = findPlayerRowById(playerSheet, playerHeaders["Id"], PLAYER_HEADERS_ROW + 1, playerId);

    const notesRow = findPlayerRowById(notesSheet, notesHeaders["Id"], NOTES_HEADERS_ROW + 1, playerId);

    if (!playerRow || !notesRow) {
      throw new Error(`Player not found: ${playerId}`);
    }

    /*
     * Keep the current values in case the second
     * sheet update fails.
     */
    previousValues = {
      playerSheet,
      notesSheet,
      playerRow,
      notesRow,
      playerHeaders,
      notesHeaders,

      name: playerSheet.getRange(playerRow, playerHeaders["Player"]).getValue(),

      positions: [
        playerSheet.getRange(playerRow, playerHeaders["Position1"]).getValue(),
        playerSheet.getRange(playerRow, playerHeaders["Position2"]).getValue(),
        playerSheet.getRange(playerRow, playerHeaders["Position3"]).getValue(),
        playerSheet.getRange(playerRow, playerHeaders["Position4"]).getValue(),
      ],

      manualRating: notesSheet.getRange(notesRow, notesHeaders[MANUAL_RATING_HEADER]).getValue()
    };

    playerSheet.getRange(playerRow, playerHeaders["Player"]).setValue(normalizedInput.name);

    ["Position1", "Position2", "Position3", "Position4"]
      .forEach((header, index) => {
        playerSheet.getRange(playerRow, playerHeaders[header]).setValue(normalizedInput.positions[index]);
      });

    if (admin){
      notesSheet.getRange(notesRow, notesHeaders[MANUAL_RATING_HEADER]).setValue(normalizedInput.manualRating);
    }

    SpreadsheetApp.flush();

    return {
      success: true,

      player: {
        id: playerId,
        name: normalizedInput.name
      }
    };
  } catch (error) {
    if (previousValues) {
      restorePreviousPlayerValues(previousValues);
    }

    throw error;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Finds a spreadsheet row using a player ID.
 */
function findPlayerRowById(sheet, idColumn, firstDataRow, playerId) {
  const lastRow = sheet.getLastRow();

  if (lastRow < firstDataRow) {
    return null;
  }

  const values = sheet.getRange(firstDataRow, idColumn, lastRow - firstDataRow + 1, 1).getValues();

  const normalizedId = String(playerId).trim();

  const rowIndex = values.findIndex(row => {
      return String(row[0]).trim() === normalizedId;});

  if (rowIndex === -1) {
    return null;
  }

  return firstDataRow + rowIndex;
}


function splitPositionCell(value) {
  return String(value || "")
    .split(",")
    .map(position =>
      position.trim().toUpperCase()
    )
    .filter(Boolean);
}


function normalizePlayerIdForEdition(playerId) {
  const normalizedId = String(playerId ?? "").trim();

  if (!normalizedId) {
    throw new Error(
      "The player ID is required."
    );
  }

  return normalizedId;
}


function restorePreviousPlayerValues(previous) {
  try {
    previous.playerSheet
      .getRange(previous.playerRow, previous.playerHeaders["Player"])
      .setValue(previous.name);

    [
      "Position1",
      "Position2",
      "Position3",
      "Position4"
    ].forEach((header, index) => {
      previous.playerSheet
        .getRange(previous.playerRow, previous.playerHeaders[header])
        .setValue(previous.positions[index]);
    });

    previous.notesSheet
      .getRange(previous.notesRow, previous.notesHeaders[MANUAL_RATING_HEADER])
      .setValue(previous.manualRating);
      
  } catch (rollbackError) {
    console.error(
      "Unable to restore player values:",
      rollbackError
    );
  }
}

function hasManualNote_(playerInput) {
  return (
    playerInput &&
    Object.prototype
      .hasOwnProperty.call(
        playerInput,
        "manualNote"
      ) &&
    playerInput.manualNote !== "" &&
    playerInput.manualNote != null
  );
}