# Sterbefall Assistent Deutschland – Multi-Person Vorsorge

Local-first PWA. Version 0.2 erweitert die Vorsorge um mehrere Personen/Angehörige.

## Neu
- Personen innerhalb von **Vorsorge** anlegen, bearbeiten, löschen und auswählen
- eigener Vorsorgefortschritt je Person
- eigene Stammdaten, Dokumentstatus und Notfallkontakt je Person
- Sterbefall kann einer vorhandenen Person zugeordnet werden
- bestehende Daten aus der alten Ein-Person-Version werden beim ersten Start automatisch als Person „Ich“ übernommen
- Service-Worker Cache auf v2 angehoben

## Lokal starten
```bash
python -m http.server 8080
```
Dann `http://localhost:8080` öffnen.
