# Sterbefall Assistent Deutschland – MVP

Eine installierbare, local-first PWA ohne Cloud-Zwang und ohne Build-Schritt.

## Enthalten
- Mobile UI im türkis/gelben Stil des Mockups
- Local-first Speicherung per IndexedDB
- Stammdaten nur einmal erfassen
- Automatische Datenübernahme in Schreiben
- Vorsorge-Fortschritt
- Dokumentstatus (Vorsorgevollmacht, Patientenverfügung, etc.)
- Notfallkarte
- Sterbefall-Fallakte
- Generator für Sterbefall-Mitteilungen/Kündigungen
- Offline-Funktion via Service Worker
- Installierbar als PWA

## Start
Einfach über einen lokalen Webserver starten, z. B.:

```bash
python -m http.server 8080
```

Dann im Browser öffnen:
`http://localhost:8080`

Wichtig: Für Service Worker/PWA ist `http://localhost` oder HTTPS nötig.

## Datenschutz
Die MVP-Version speichert Daten ausschließlich lokal im Browser. Eine zusätzliche Verschlüsselung sensibler Daten ist für die nächste Ausbaustufe vorgesehen.
