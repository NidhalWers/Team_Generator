function main(){
  genererEquipes([14,21,31,32,37,40,52,53,55,63,64,70,83,93,94,97,98,100,101,103])
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚽ Equipes")
    .addItem("Générer les équipes", "genererEquipes")
    .addToUi();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index');
}
