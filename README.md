# StudioCoach - Fitnessstudio Website und Trainingsprogramm

StudioCoach ist eine mehrseitige statische Website mit integriertem Trainings-Tracker. Das Projekt ist für ein Fitnessstudio-Training gedacht: Es enthält einen vollständigen Push/Pull/Legs-Plan, eine praktische Trainingserfassung, Historie, Exportfunktionen und einen Praxisleitfaden.

## Seitenstruktur

```text
gym-tracker/
├── index.html                # Startseite mit Überblick und Status
├── programm.html             # Vollständiger Push/Pull/Legs-Trainingsplan
├── training.html             # App-Bereich zum Erfassen einer Einheit
├── historie.html             # Gespeicherte Trainings, Suche, Export, Laden
├── praxis.html               # Umsetzung im Studio: Warm-up, RPE, Progression
├── style.css                 # Gemeinsames Website- und App-Design
├── app.js                    # Speicherung, Berechnung, Export, Historie
└── assets/
    └── studio-dashboard.svg  # Visuelles Asset für die Startseite
```

## So wird es in der Praxis benutzt

1. `programm.html` öffnen und den passenden Trainingstag wählen.
2. Im Studio `training.html` öffnen.
3. Split auswählen und `Plan laden` klicken.
4. Körpergewicht, Energie, Schlaf und Ziel der Einheit eintragen.
5. Nach jedem Arbeitssatz Gewicht, Wiederholungen und RPE dokumentieren.
6. Nach dem Training Notizen ergänzen und speichern.
7. In `historie.html` ältere Einheiten prüfen, exportieren oder in die Training-Seite laden.

## Trainingslogik

- Ziel ist saubere progressive Überlastung, nicht blindes Gewichtsteigern.
- Wenn alle Sätze im oberen Wiederholungsbereich liegen und die Technik stabil ist, wird beim nächsten Mal um 2,5-5% erhöht.
- Wenn Sätze unter dem Zielbereich liegen, bleibt das Gewicht gleich.
- Wenn RPE 9.5-10 erreicht wird oder Schmerzen auftreten, wird Gewicht gehalten oder reduziert.
- Aufwärmsätze werden nicht als Arbeitssätze dokumentiert.

## Speicherung und Export

Die App nutzt `localStorage`. Die Daten bleiben also nur im jeweiligen Browser und auf dem jeweiligen Gerät erhalten.

Empfehlung:

- Nach jeder Einheit speichern.
- Wöchentlich TXT oder CSV exportieren.
- Vor dem Löschen von Browserdaten immer exportieren.

## Lokal öffnen

Es ist kein Build-Schritt nötig. Einfach `index.html` im Browser öffnen.

## GitHub Pages

1. Dateien ins Repository hochladen.
2. GitHub `Settings` öffnen.
3. `Pages` öffnen.
4. Source: `Deploy from a branch`.
5. Branch `main` und `/ root` auswählen.
6. Speichern.

## Sinnvolle nächste Ausbaustufen

- Benutzerkonten und Cloud-Speicherung
- Diagramme für Körpergewicht, Volumen und Kraftwerte
- PDF-Export
- Timer für Satzpausen
- Adminbereich für Trainer
- Individuelle Pläne pro Person
- Mobile Installierbarkeit als PWA
