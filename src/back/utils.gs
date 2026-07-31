function getSheetData(sheetName, headerIndex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`The "${sheetName}" sheet could not be found.`);
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= headerIndex) {
    return [];
  }

  const headers = data[headerIndex];
  const rows = data.slice(headerIndex+1);

  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      if (header !== "") {
        obj[String(header).trim()] = row[index];
      }
    });

    return obj;
  });
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function getStandardDeviation(values) {

  const mean = values.reduce((a,b)=>a+b,0) / values.length;

  const variance = values.reduce((sum,val)=>{
    return sum + Math.pow(val - mean, 2);
  }, 0) / values.length;

  return Math.sqrt(variance);
}

function shuffleArray(array, randomFunction = Math.random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomFunction() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Returns one-based column numbers using the header labels.
 */
function getSheetHeaderMap(sheet, headerRow) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    throw new Error(`The "${sheet.getName()}" sheet has no headers.`);
  }

  const headers = sheet
    .getRange(headerRow, 1, 1, lastColumn)
    .getDisplayValues()[0];

  return headers.reduce(
    (map, header, index) => {
      const normalizedHeader = String(header).trim();

      if (normalizedHeader) {
        map[normalizedHeader] = index + 1;
      }

      return map;
    },
    {}
  );
}

function readNumericColumnValues(sheet, firstDataRow, column) {
  const lastRow = sheet.getLastRow();

  if (lastRow < firstDataRow) {
    return [];
  }

  return sheet
    .getRange(firstDataRow, column,lastRow - firstDataRow + 1, 1)
    .getValues()
    .flat()
    .filter(value => value !== "" && value !== null && Number.isFinite(Number(value)))
    .map(Number);
}

function isHalfStep(value) {
  return Number.isInteger(value * 2);
}


function getDuplicatedValues(values) {
  const occurrences = {};
  const duplicated = [];

  values.forEach(value => {
    occurrences[value] = (occurrences[value] || 0) + 1;

    if (occurrences[value] === 2) {
      duplicated.push(value);
    }
  });

  return duplicated;
}

function columnNumberToLetter(columnNumber) {
  let letter = "";
  let number = columnNumber;

  while (number > 0) {
    const remainder = (number - 1) % 26;

    letter =
      String.fromCharCode(65 + remainder) +
      letter;

    number = Math.floor(
      (number - 1) / 26
    );
  }

  return letter;
}
