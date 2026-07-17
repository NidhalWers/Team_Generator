function getSheetData(sheetName, headerIndex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`La feuille "${sheetName}" est introuvable.`);
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


