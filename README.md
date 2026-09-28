# Sterbefall Assistent Deutschland v0.6

Local-first PWA für Vorsorge, mehrere Angehörige und Sterbefall-Organisation.

## Neu in v0.6

- Amtliche Blanko-PDFs werden bevorzugt **lokal** geladen.
- Erwarteter Ordner: `forms/`.
- Unterstützte lokale Dateinamen:
  - `vorsorgevollmacht-bmj.pdf`
  - `betreuungsverfuegung-bmj.pdf`
  - `zvr-formular-p.pdf`
- Alternativ kann eine amtliche PDF einmal über die App ausgewählt und als lokale Blanko-Vorlage in IndexedDB gespeichert werden.
- Persönliche Daten werden beim Befüllen nicht an den Formularanbieter übertragen.
- Vorlagenstand und Herausgeber werden in der Oberfläche angezeigt.
- Fallback: Nutzer kann eine aktuelle Original-PDF manuell auswählen.

## Wichtiger Hinweis

Die amtlichen PDFs selbst sollten nur aus den offiziellen Quellen bezogen und bei neuen Fassungen ausgetauscht werden. In dieser Entwicklungsumgebung konnten die BMJ-/ZVR-Dateien nicht zuverlässig als Binärdateien in das ZIP übernommen werden. Die App ist deshalb so vorbereitet, dass du die drei Original-PDFs nur in `forms/` legen musst; danach funktionieren sie offline. Alternativ können sie direkt in der App einmalig lokal installiert werden.

## GitHub Pages

Den kompletten Inhalt des Ordners in das Repository kopieren. Wegen des Service Workers nach einem Update ggf. `Strg+F5` ausführen oder die Website-Daten löschen.
