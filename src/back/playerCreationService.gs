const PLAYER_SHEET_NAME = "Joueurs";
const NOTES_SHEET_NAME = "Notes";

const PLAYER_HEADERS_ROW = 1;
const NOTES_HEADERS_ROW = 2;

const MANUAL_NOTE_HEADER = "Note manuelle (ancien format)";

const PLAYER_POSITION_VALUES = [
  "G",
  "DEF",
  "MIL",
  "AIL",
  "BUT"
];


/**
 * Ajoute un joueur dans les feuilles Joueurs et Notes.
 *
 * @param {{
 *   name: string,
 *   poste1: string,
 *   poste2: string,
 *   poste3: string,
 *   poste4: string,
 *   manualNote: number
 * }} playerInput
 *
 * @return {{
 *   success: boolean,
 *   player: {
 *     id: string,
 *     nom: string
 *   }
 * }}
 */
function addPlayer(playerInput) {
  const lock = LockService.getDocumentLock();

  try {
    lock.waitLock(10000);

    const normalizedInput = validateAndNormalizePlayerInput(
      playerInput
    );

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const playersSheet = spreadsheet.getSheetByName(PLAYER_SHEET_NAME);
    const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET_NAME);

    if (!playersSheet || !notesSheet) {
      throw new Error('Les feuilles "Joueurs" et "Notes" doivent être initialisées.');
    }

    const playerHeaderMap = getSheetHeaderMap(playersSheet, PLAYER_HEADERS_ROW);
    const notesHeaderMap = getSheetHeaderMap(notesSheet, NOTES_HEADERS_ROW);

    const playerId = generateNextPlayerId(playersSheet, notesSheet, playerHeaderMap, notesHeaderMap);

    const playerRow = appendPlayerRow(playersSheet, playerHeaderMap, playerId, normalizedInput);

    try {
      appendNotesRow(notesSheet, notesHeaderMap, playerId, normalizedInput.manualNote);
    } catch (error) {
      /*
       * Si l'écriture dans Notes échoue, on retire la ligne Joueurs
       * afin de ne pas laisser les deux feuilles désynchronisées.
       */
      playersSheet.deleteRow(playerRow);
      throw error;
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      player: {
        id: String(playerId),
        nom: normalizedInput.name
      }
    };

  } finally {
    lock.releaseLock();
  }
}


/**
 * Valide et normalise les données provenant de la WebApp.
 */
function validateAndNormalizePlayerInput(playerInput) {
  if (!playerInput) {
    throw new Error("Les informations du joueur sont manquantes.");
  }

  const name = String(playerInput.name || "").trim();

  if (!name) {
    throw new Error("Le nom du joueur est obligatoire.");
  }

  const manualNote = Number(playerInput.manualNote);

  if (!Number.isFinite(manualNote) || manualNote < 0.5 || manualNote > 5) {
    throw new Error("La note manuelle doit être comprise entre 0,5 et 5.");
  }

  if (!isHalfStep(manualNote)) {
    throw new Error("La note manuelle doit évoluer par palier de 0,5.");
  }

  const postes = [
    normalizePositionCell(playerInput.poste1),
    normalizePositionCell(playerInput.poste2),
    normalizePositionCell(playerInput.poste3),
    normalizePositionCell(playerInput.poste4)
  ];

  const allPositions = postes.flatMap(positionCell => positionCell ? positionCell.split(",") : []);

  const invalidPositions = allPositions.filter(position => !PLAYER_POSITION_VALUES.includes(position));

  if (invalidPositions.length > 0) {
    throw new Error(`Poste inconnu : ${invalidPositions.join(", ")}.`);
  }

  const duplicatedPositions = getDuplicatedValues(allPositions);

  if (duplicatedPositions.length > 0) {
    throw new Error("Un poste ne peut apparaître que dans un seul niveau : " + duplicatedPositions.join(", ") + ".");
  }

  return {
    name,
    manualNote,
    postes
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
 * L'ID est numérique et unique dans les deux feuilles.
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
 * Ajoute la ligne dans Joueurs.
 */
function appendPlayerRow(sheet, headerMap, playerId, input) {
  const rowNumber = Math.max(sheet.getLastRow() + 1, PLAYER_HEADERS_ROW + 1);

  const row = new Array(sheet.getLastColumn()).fill("");

  row[headerMap["Présent"] - 1] = false;
  row[headerMap["Joueur"] - 1] = input.name;
  row[headerMap["Poste1"] - 1] = input.postes[0];
  row[headerMap["Poste2"] - 1] = input.postes[1];
  row[headerMap["Poste3"] - 1] = input.postes[2];
  row[headerMap["Poste4"] - 1] = input.postes[3];
  row[headerMap["Id"] - 1] = playerId;

  sheet
    .getRange(rowNumber, 1, 1, row.length)
    .setValues([row]);

  // Joueurs.Note référence la note manuelle de Notes.
  setPlayerNoteFormula(sheet, rowNumber, headerMap["Note"], headerMap["Id"]);

  return rowNumber;
}


/**
 * Écrit Joueurs.Note avec une formule indépendante de l'ordre
 * des colonnes des deux feuilles.
 */
function setPlayerNoteFormula(playersSheet, rowNumber, noteColumn, idColumn) {
  const notesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOTES_SHEET_NAME);
  const notesHeaders = getSheetHeaderMap(notesSheet, NOTES_HEADERS_ROW);

  const notesIdColumn = notesHeaders["Id"];
  const manualNoteColumn = notesHeaders["Note manuelle (ancien format)"];

  const playerIdAddress = playersSheet.getRange(rowNumber, idColumn).getA1Notation();

  const notesIdRange =`${NOTES_SHEET_NAME}!$${columnNumberToLetter(notesIdColumn)}
    :$${columnNumberToLetter(notesIdColumn)}`;

  const manualNoteRange =`${NOTES_SHEET_NAME}!$${columnNumberToLetter(manualNoteColumn)}
    :$${columnNumberToLetter(manualNoteColumn)}`;

  const formula = [
    `=INDEX(${manualNoteRange};`,
    ` MATCH(${playerIdAddress};${notesIdRange};0))`
  ].join("");

  playersSheet
    .getRange(rowNumber, noteColumn)
    .setFormula(formula);
}

function appendNotesRow(sheet, headerMap, playerId, manualNote) {
  const rowNumber = Math.max(sheet.getLastRow() + 1, NOTES_HEADERS_ROW + 1);

  const row = new Array(sheet.getLastColumn()).fill("");

  row[headerMap["Id"] - 1] = playerId;

  /*
   * Toutes les colonnes situées entre Défenseur et Poison ++
   * sont initialisées à false.
   */
  const firstBooleanColumn = headerMap["Défenseur"];
  const lastBooleanColumn = headerMap["Poison ++"];

  for (let column = firstBooleanColumn; column <= lastBooleanColumn; column++) {
    row[column - 1] = false;
  }

  row[headerMap["Note manuelle (ancien format)"] - 1] = manualNote;

  sheet
    .getRange(rowNumber, 1, 1, row.length)
    .setValues([row]);

  setNotesPlayerNameFormula(sheet, rowNumber,headerMap["Joueur"]);

  setNotesAutomaticFormula(sheet, rowNumber, headerMap["Note automatique (sur 5)"], firstBooleanColumn, lastBooleanColumn);

  setNotesWeightedFormula(sheet, rowNumber, headerMap["Note automatique avec pondération"], firstBooleanColumn, lastBooleanColumn);

  return rowNumber;
}


function setNotesPlayerNameFormula(notesSheet, rowNumber, playerNameColumn) {
  const playersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PLAYER_SHEET_NAME);

  const playerHeaders = getSheetHeaderMap(playersSheet, PLAYER_HEADERS_ROW);

  const idCell = notesSheet.getRange(rowNumber, 1).getA1Notation();

  const playersNameRange =
    `${PLAYER_SHEET_NAME}!$${
      columnNumberToLetter(playerHeaders["Joueur"])
    }:$${
      columnNumberToLetter(playerHeaders["Joueur"])
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
function getPlayerById(playerId) {
  const normalizedId = normalizePlayerIdForEdition(playerId);

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const playerSheet = spreadsheet.getSheetByName(PLAYER_SHEET_NAME);

  const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET_NAME);

  if (!playerSheet || !notesSheet) {
    throw new Error("Les feuilles Joueurs ou Notes sont introuvables.");
  }

  const playerHeaders = getSheetHeaderMap(playerSheet, PLAYER_HEADERS_ROW);

  const notesHeaders = getSheetHeaderMap(notesSheet, NOTES_HEADERS_ROW);

  const playerRow = findPlayerRowById(playerSheet, playerHeaders["Id"], PLAYER_HEADERS_ROW + 1, normalizedId);

  const notesRow = findPlayerRowById(notesSheet, notesHeaders["Id"], NOTES_HEADERS_ROW + 1, normalizedId);

  if (!playerRow || !notesRow) {
    throw new Error(`Joueur introuvable : ${normalizedId}`);
  }

  return {
    id: normalizedId,

    name: String(playerSheet.getRange(playerRow, playerHeaders["Joueur"]).getValue() || ""),

    poste1: splitPositionCell(playerSheet.getRange(playerRow,playerHeaders["Poste1"]).getValue()),
    poste2: splitPositionCell(playerSheet.getRange(playerRow,playerHeaders["Poste2"]).getValue()),
    poste3: splitPositionCell(playerSheet.getRange(playerRow,playerHeaders["Poste3"]).getValue()),
    poste4: splitPositionCell(playerSheet.getRange(playerRow,playerHeaders["Poste4"]).getValue()),

    manualNote: Number(notesSheet.getRange(notesRow, notesHeaders[MANUAL_NOTE_HEADER]).getValue())
  };
}

/**
 * Updates an existing player in Joueurs and Notes.
 */
function updatePlayer(playerInput) {
  const lock = LockService.getDocumentLock();

  lock.waitLock(30000);

  let previousValues = null;

  try {
    if (!playerInput) {
      throw new Error("Les informations du joueur sont manquantes.");
    }

    const playerId = normalizePlayerIdForEdition(playerInput.id);

    const normalizedInput = validateAndNormalizePlayerInput(playerInput);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    const playerSheet = spreadsheet.getSheetByName(PLAYER_SHEET_NAME);

    const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET_NAME);

    if (!playerSheet || !notesSheet) {
      throw new Error("Les feuilles Joueurs ou Notes sont introuvables.");
    }

    const playerHeaders = getSheetHeaderMap(playerSheet, PLAYER_HEADERS_ROW);

    const notesHeaders = getSheetHeaderMap(notesSheet, NOTES_HEADERS_ROW);

    const playerRow = findPlayerRowById(playerSheet, playerHeaders["Id"], PLAYER_HEADERS_ROW + 1, playerId);

    const notesRow = findPlayerRowById(notesSheet, notesHeaders["Id"], NOTES_HEADERS_ROW + 1, playerId);

    if (!playerRow || !notesRow) {
      throw new Error(`Joueur introuvable : ${playerId}`);
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

      name: playerSheet.getRange(playerRow, playerHeaders["Joueur"]).getValue(),

      postes: [
        playerSheet.getRange(playerRow, playerHeaders["Poste1"]).getValue(),
        playerSheet.getRange(playerRow, playerHeaders["Poste2"]).getValue(),
        playerSheet.getRange(playerRow, playerHeaders["Poste3"]).getValue(),
        playerSheet.getRange(playerRow, playerHeaders["Poste4"]).getValue(),
      ],

      manualNote: notesSheet.getRange(notesRow, notesHeaders[MANUAL_NOTE_HEADER]).getValue()
    };

    playerSheet.getRange(playerRow, playerHeaders["Joueur"]).setValue(normalizedInput.name);

    ["Poste1", "Poste2", "Poste3", "Poste4"]
      .forEach((header, index) => {
        playerSheet.getRange(playerRow, playerHeaders[header]).setValue(normalizedInput.postes[index]);
      });

    notesSheet.getRange(notesRow, notesHeaders[MANUAL_NOTE_HEADER]).setValue(normalizedInput.manualNote);

    SpreadsheetApp.flush();

    return {
      success: true,

      player: {
        id: playerId,
        nom: normalizedInput.name
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
      "L'identifiant du joueur est obligatoire."
    );
  }

  return normalizedId;
}


function restorePreviousPlayerValues(previous) {
  try {
    previous.playerSheet
      .getRange(previous.playerRow, previous.playerHeaders["Joueur"])
      .setValue(previous.name);

    [
      "Poste1",
      "Poste2",
      "Poste3",
      "Poste4"
    ].forEach((header, index) => {
      previous.playerSheet
        .getRange(previous.playerRow, previous.playerHeaders[header])
        .setValue(previous.postes[index]);
    });

    previous.notesSheet
      .getRange(previous.notesRow, previous.notesHeaders[MANUAL_NOTE_HEADER])
      .setValue(previous.manualNote);
      
  } catch (rollbackError) {
    console.error(
      "Unable to restore player values:",
      rollbackError
    );
  }
}