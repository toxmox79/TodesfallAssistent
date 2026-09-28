# Sterbefall Assistent Deutschland v0.8

Neu in v0.8: **Anträge vorbereiten**

Im Sterbefall-Bereich können vier besonders wichtige Leistungen direkt vorbereitet werden:

- Vorschuss für das Sterbevierteljahr (Renten Service Deutsche Post)
- Witwen-/Witwerrente (DRV R0500)
- Halb-/Vollwaisenrente (DRV R0500 + R0610)
- Übernahme erforderlicher Bestattungskosten nach § 74 SGB XII

Die App übernimmt vorhandene Daten von verstorbener und antragstellender Person automatisch. Bankverbindung, Rentenversicherungsnummer, Steuer-ID und Krankenkasse können lokal für weitere Anträge wiederverwendet werden. Für jeden Antrag gibt es eine Unterlagen-Checkliste, einen Fortschritt, eine druckbare Antragsmappe und Links zum offiziellen Verfahren.

Status in der Fallakte: Offen → Vorbereitet → Beantragt → Erledigt.

Wichtig: Für DRV und Renten Service ersetzt die Antragsmappe nicht das offizielle Formular bzw. eAntrag. Bei § 74 SGB XII gibt es kein bundeseinheitliches Formular; die App erzeugt daher ein nutzbares Anschreiben und eine Daten-/Unterlagenübersicht.

# Sterbefall Assistent Deutschland v0.7

Neu: Der Sterbefall-Bereich ist jetzt ein geführter Angehörigen-Assistent mit aufklappbaren Aufgaben, Fristen, typischen Unterlagen, zuständiger Stelle, offiziellen Links und drei Statusstufen (offen / beantragt / erledigt).

Besonders ergänzt wurden:
- Vorschuss Sterbevierteljahr
- Witwen-/Witwerrente
- Halb-/Vollwaisenrente
- Erziehungsrente
- Leistungen der gesetzlichen Unfallversicherung
- Übernahme von Bestattungskosten nach § 74 SGB XII
- Betriebsrente / Zusatzversorgung
- Beamtenrechtliche Hinterbliebenenversorgung
- Lebens-/Sterbegeldversicherung
- Erbausschlagung
- Erbschein
- Erbschaftsteuer-Anzeige
- Grundbuchberichtigung
- Kindergeld/Kinderzuschlag
- Prüfung von Wohngeld/Bürgergeld/Grundsicherung

Die Fallakte fragt einige Eckdaten ab und blendet offensichtlich unpassende Anträge aus.

# Sterbefall Assistent Deutschland v0.6.3

## Neu
- In den druckbaren Formularen wurde der sichtbare „ENTWURF“-Hinweis entfernt.
- Ausgefüllte lokale PDFs werden nach der Erzeugung nicht nur heruntergeladen, sondern können über die System-Teilen-Funktion versendet werden.
- Auf Android kann dabei – sofern installiert/verfügbar – auch Google Drive im Teilen-Menü gewählt werden.
- Für jedes Vorsorgedokument können Foto/Scan oder PDF der unterschriebenen Fassung lokal hinterlegt werden.
- Für die physische Ablage gibt es getrennte Felder „Aufbewahrungsort“ und „Ordner / Register“.
- Hinterlegte Kopien können angesehen, geteilt oder wieder entfernt werden.
- Die Dateien bleiben local-first in IndexedDB auf dem Gerät.

## Hinweis
Das Testament bleibt bewusst ein Vorbereitungsblatt. Ein ausgedruckter Computertext ist nicht automatisch ein wirksames eigenhändiges Testament.

## GitHub Pages
Den kompletten Inhalt einschließlich `forms/` hochladen. Danach wegen des aktualisierten Service Workers einmal Strg+F5 ausführen.
