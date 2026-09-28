# Sterbefall Assistent Deutschland v0.6.4

## Schwerpunkt dieser Version: Formular-Abgleich
Die Formularlogik wurde gegen die aktuell veröffentlichten offiziellen Strukturen geprüft und überarbeitet.

### Angeglichen
- Vorsorgevollmacht: Reihenfolge und Ja/Nein-Auswahl nach BMJ, Stand Januar 2023.
- Betreuungsverfügung: gewünschte Person, Ersatzperson, ausgeschlossene Person und vier Wunschfelder nach BMJ, Stand Januar 2023.
- Konto-/Depot-/Schrankfachvollmacht: feste Struktur des mit der Deutschen Kreditwirtschaft abgestimmten Formulars. Die frühere frei wählbare Option „über den Tod hinaus“ wurde entfernt; das Formular sieht die Fortgeltung nach dem Tod bereits vor.
- ZVR Formular P: Felder, Aufbewahrungsort, Zahlungsweise und Vertrauensperson nach Stand 01.02.2024.
- Organspende: fünf Alternativen wie beim offiziellen Organspendeausweis.
- Patientenverfügung: Aufbau nach den BMJ-Textbausteinen. Das BMJ stellt hierfür kein einheitliches amtliches Ankreuzformular bereit.

### Zusätzlich verbessert
- Stammdaten um Anrede, Titel, Geburtsname, Geburtsort, Adresszusatz und Land ergänzt.
- Automatische PDF-Befüllung erkennt die Felder der mitgelieferten Vorlagen gezielt statt nur über grobe Heuristiken.
- Vorsorgevollmacht übernimmt jetzt auch sämtliche Einzelentscheidungen als Ja/Nein in die PDF.
- Patientenverfügung und Organspende übernehmen die Auswahlfelder in die PDF.
- ZVR übernimmt soweit vorhanden auch den Umfang der Vorsorgevollmacht.
- ZVR-Eingabemaske um Zahlungsweise, IBAN, Kontoinhaber, Aufbewahrungsart und Vertrauensperson erweitert.

## Welche Vorlagen sind amtlich standardisiert?
Die PDFs in `forms/` sind lokal eingebettete, ausfüllbare Reproduktionen der jeweils veröffentlichten Struktur. Sie sind nicht die binär identischen Behörden-PDF-Dateien.

- BMJ Vorsorgevollmacht: Struktur nach offizieller Vorlage
- BMJ Betreuungsverfügung: Struktur nach offizieller Vorlage
- BMJ/DK Bankvollmacht: Struktur nach abgestimmter Vorlage
- ZVR Formular P: Struktur nach Formular P
- Organspendeausweis: Struktur nach offizieller Entscheidungssystematik
- Patientenverfügung: Zusammenstellung nach BMJ-Textbausteinen; kein einheitliches amtliches Originalformular
- Schweigepflichtentbindung: App-Vorlage, da kein bundeseinheitliches amtliches Standardformular
- Bestattungswünsche: App-Vorlage
- Testament: nur Vorbereitungsblatt, kein fertiges Testament

Weitere Details stehen in `FORMULAR-ABGLEICH.md`.

## GitHub Pages
Den kompletten Inhalt einschließlich des Ordners `forms/` hochladen. Danach einmal Strg+F5 ausführen, damit der neue Service-Worker-Cache `v064` aktiv wird.
