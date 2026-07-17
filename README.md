# ⚽ Football Team Generator

Generate balanced football teams directly from Google Sheets.

This project uses player ratings, preferred positions and an optimization algorithm to automatically generate the fairest teams possible.

The whole project runs on **Google Apps Script**, making it usable from both desktop and mobile without installing anything.

---

# Features

- ⚽ Automatic team generation
- 🎯 Position-aware assignment
- ⭐ Multiple preferred positions per player
- 📊 Automatic team balancing
- 👥 Support for substitutes
- 🧩 Support for partial teams
- 📱 Responsive Web App
- 📈 Automatic player rating system
- 🔧 Spreadsheet auto initialization

---

# Screenshots

![selection](Images/screen-selection.png)

![generated teams](Images/screen-generated-teams.png)

![analyze generation](Images/screen-generated-teams-analyzed.png)

---

# How it works

Each player has:

- a rating (/5)
- up to 4 preferred position levels
- multiple playable positions per level

Example:

| Position level | Value |
|---------------|-------|
| Poste1 | DEF |
| Poste2 | MIL,AIL |
| Poste3 | BUT |
| Poste4 | |

The algorithm:

1. reads selected players
2. builds a player pool
3. generates hundreds of random distributions
4. optimizes every team's lineup
5. computes the standard deviation of adjusted team ratings
6. keeps the best solution

---

# Installation

## 1. Create a Google Spreadsheet

Create a new empty spreadsheet.

---

## 2. Create an Apps Script project

Extensions → Apps Script

Copy every file from this repository.

---

## 3. Initialize the spreadsheet

From the custom menu: 
```
🛠️ Custom handling 
            Initialize sheets
```

This automatically creates:

- Joueurs
- Notes

with all required columns, formulas and checkboxes.

---

## 4. Deploy the Web App

Deploy → New deployment

- Type: ``Web App``
- Execute as: ``Me``
- Access: ``Anyone with the link``

Copy the generated URL.

---

# Tutorial

## Add players

Fill the **Joueurs** sheet.

Example:

| Player | Rating | Poste1 | Poste2 |
|---------|---------|---------|---------|
| John | 4.5 | DEF | MIL |
| Mike | 3.5 | AIL | BUT |

---

## Configure ratings

The **Notes** sheet lets you compute ratings automatically using weighted criteria.

You can:

- enable/disable criteria
- adjust weights
- keep using manual ratings

---

## Generate teams

Open the Web App.

Select the players.

Press ``Generate``

The application returns the optimized teams.

---

# Rating system

Ratings can be computed automatically from customizable criteria.

Example:

- Technique
- Mental
- Pressing
- Communication
- Cold blood
- etc.

Each criterion weight can be modified directly in the spreadsheet.

---
# Position system

Each player can have up to four preference levels.

Example:

```
Poste1 : DEF
Poste2 : DEF,MIL
Poste3 : MIL
Poste4 : BUT
```

The algorithm applies decreasing coefficients depending on the position level.

---

# Team balancing

The optimizer evaluates hundreds of random distributions.

For every generated team:

- best lineup is computed
- adjusted ratings are calculated
- standard deviation between teams is measured

The solution with the lowest deviation is kept.

# Algorithm

The generator performs approximately 300 simulations.

For each simulation:

- players are shuffled
- teams are built
- each lineup is optimized according to available positions
- adjusted ratings are computed
- the standard deviation between teams is measured

The distribution with the smallest deviation is selected.

---

# Project structure

```
Apps Script
│
├── teamGenerator.gs
├── player.gs
├── teamDistribution.gs
├── spreadsheetInitialization.gs
├── utils.gs
│
├── index.html
├── styles.html
├── scripts.html
│
└── Tests/
```

---

# Why Google Sheets?

The goal of this project is to allow any group of friends to generate balanced football teams without installing any software.

Everything runs inside Google Sheets:

- free
- mobile friendly
- collaborative
- easy to customize

---

# Roadmap

- [x] Team generation from player rating
- [x] Responsive Web App
- [x] Player positioning
- [x] Unit tests
- [x] Spreadsheet initialization
- [ ] Player's addition from Web App
- [ ] Position optimization

---

# Contributing

Issues and Pull Requests are welcome.

---