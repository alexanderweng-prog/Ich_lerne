# Mastery Mathe – Prototyp

Lernapp für Mathematik nach dem Mastery-Prinzip. Ziel: von null bis zum Stoff der 3. Sek (Thurgau, Lehrplan 21).

**113 Themen in 12 Bereichen**, abgeleitet aus den Thurgauer Lehrplan-Plakaten Mathematik Zyklus 1–3:
Zahlen (11), Grundlagen (10), Dezimalzahlen (8), Brüche (12), Potenzen (6), Terme (9), Gleichungen (11),
Prozent & Proportionalität (10), Grössen (10), Geometrie (13), Funktionen (8), Daten & Zufall (5).
Jedes Thema trägt Kompetenz und Kompetenzstufe (z. B. `MA.1.A.4.i`). Themen oberhalb der Markierung
auf dem Zyklus-3-Plakat (vermutlich Grundanspruch) sind als «erweitert» gekennzeichnet.

Nicht abgedeckt (für eine App mit automatischer Prüfung wenig geeignet): Konstruieren mit Zirkel/Geodreieck,
Körper skizzieren, Kopfgeometrie, Erforschen/Argumentieren (MA.x.B), Diagramme selbst erstellen.

## Online testen

https://alexanderweng-prog.github.io/Ich_lerne/ – wird bei jedem Push auf den Branch automatisch neu gebaut (`.github/workflows/pages.yml`).

## Starten

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # automatische Tests (Mathe-Prüfung, Generatoren, Lernmodell)
npm run build      # fertige App in dist/ (statische Dateien, offline-fähig)
```

Der Ordner `dist/` kann auf jeden Webserver gelegt werden (Schulserver, GitHub Pages, Netlify …).
Nach dem ersten Öffnen läuft die App **vollständig offline** (Service Worker). Auf iPads über
«Teilen → Zum Home-Bildschirm» installieren – sonst kann Safari die Daten nach 7 Tagen ohne Nutzung löschen.

## Technik

- **TypeScript + Preact + Vite**, als installierbare Web-App (PWA). Keine Server-Komponente, kein Login.
- **Eigene Mathe-Engine** (`src/math/`): exakte Bruchrechnung (BigInt), Parser für Schülereingaben
  (`3/4`, `2 1/3`, `0,75`, `3x(2x − 1)`, `x = 5`, `h = 2A/g`), Vergleich über Polynom-Normalform
  bzw. exakte Auswertung. Prüft zusätzlich die **Form** (vollständig gekürzt, ausmultipliziert, ausgeklammert …).
- **Aufgabengeneratoren** (`src/curriculum/`): jede Aufgabe mit Zufallszahlen, Lösungsweg und typischen Fehlvorstellungen.
- **Daten** bleiben lokal im Browser. Export/Import als JSON-Datei für Lehrperson und Sicherung.

## Didaktisches Modell

| Element | Umsetzung | Code |
|---|---|---|
| Mastery Learning (Bloom, Guskey) | Thema erst frei, wenn Voraussetzungen «gelernt» sind. Kriterium: 4 von 5 ohne Hilfe, letzte 2 richtig. «Gemeistert» erst nach erfolgreicher Kontrolle ≥ 1 Tag später. | `engine/model.ts` |
| Adaptiver Einstufungstest | Binäre Suche auf dem Wissensgraphen, max. 30 Aufgaben, «Weiss ich nicht»-Knopf statt Raten, Auswahlaufgaben brauchen 2 Treffer. | `engine/placement.ts` |
| Lösungsbeispiele + Fading (Sweller, Renkl) | Beispiel → Lösungsweg ergänzen (Vorgaben werden weniger) → selbständig | `ui/Learn.tsx` |
| Selbsterklärung (Chi, Rittle-Johnson) | Denkfrage nach dem Beispiel | `selfExplain` in den Themen |
| Elaboriertes Feedback (Hattie & Timperley) | Sofortige Rückmeldung, gezielte Meldung bei erkannter Fehlvorstellung, Lösungsweg | `math/check.ts` |
| Verteiltes Wiederholen (Cepeda u. a.) | Wachsende Abstände (≈ 1, 2.5, 6, 15 … Tage), Fehler → Abstand stark verkürzt | `recordReview` |
| Implizite Wiederholung | Lösen eines Themas schiebt fällige Voraussetzungen nach hinten | `implicitCredit` |
| Interleaving (Rohrer) | Wiederholungen gemischt, nie zwei aus demselben Bereich nacheinander | `ui/Review.tsx` |
| Kalibrierung (Metakognition) | «sicher / unsicher» vor dem Prüfen; sicher + falsch → stärker zurückgesetzt | `recordReview` |
| Gestufte Hilfen | Tipp → Lösungsschritte einzeln; Aufgaben mit Hilfe zählen nicht fürs Kriterium | `ui/TaskView.tsx` |
| Feststecken | Nach 3 Fehlern: Beispiel erneut oder Grundlagen-Check (fehlende Voraussetzung wird zurückgestuft) | `ui/Learn.tsx` |

Bewusst **nicht** umgesetzt: Lernstile, Bestenlisten, Punkte-Shop.

## Offene Punkte / bekannte Grenzen

- **Lehrplan-Zuordnung** ist grob (MA.1.A / MA.1.C). Stufe und Niveau pro Thema sind Vorschläge und
  müssen mit eurem Lehrmittel und der Thurgauer Niveau-Regelung abgeglichen werden.
- Die Mastery-Schwellen und Wiederholungsabstände sind begründete Startwerte, keine empirisch kalibrierten Werte.
- Die Lehrpersonen-Übersicht funktioniert über Dateiexport. Ein Klassen-Server (synchronisiert) wäre der nächste grosse Schritt
  und braucht eine Datenschutzabklärung (nDSG, kantonale Vorgaben).
- Keine KI-Komponente: Alles läuft offline und deterministisch. Eine optionale KI-Erklärhilfe (online) könnte später ergänzt werden.

## Struktur

```
src/math/          Brüche, Parser, Antwortprüfung
src/curriculum/    Wissensgraph + Aufgabengeneratoren (grundlagen, brueche, terme, gleichungen)
src/engine/        Lernmodell, Einstufungstest, Speicherung
src/ui/            Oberfläche
tests/             Vitest-Tests (je Generator 400 Zufallsaufgaben gegen die Prüfung)
```
