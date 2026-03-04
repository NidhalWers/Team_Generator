function main(){
  // 2 complete with 1 incomplete team
  // genererEquipes([14,21,31,32,37,40,52,53,55,63,64,70,83,93,94,97,98,100,101,103])
  // 3 complete teams
  genererEquipes([21,27,32,37,40,52,53,55,61,62,63,64,69,70,83,91,93,94,95,102,103]);
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
