# ACC v1.0.1 — Release Checklist

Letzte Aktualisierung: 25. Jun 2026  
Legende: ✅ erledigt · ⏳ warte auf manuelle Aktion · 🔧 noch zu tun

---

## 1 · Code & Build

| # | Aufgabe | Status |
|---|---------|--------|
| 1.1 | 20 Provider implementiert (inkl. MiniMax + Z.ai) | ✅ |
| 1.2 | Gemini-Methodenreihenfolge: api-batchexecute zuerst | ✅ |
| 1.3 | `npm run build` → alle Artefakte in `dist/` | ✅ |
| 1.4 | `node scripts/validate-release.mjs` → OK (20 Provider, v1.0.1, desc ≤132) | ✅ |
| 1.5 | `node scripts/check-probe-coverage.mjs` → 20/20 | ✅ |
| 1.6 | Chrome MV3 manifest + service_worker | ✅ |
| 1.7 | Firefox MV3 + `data_collection_permissions.required: ["none"]` | ✅ |
| 1.8 | Bestätigungs-Dialog vor irreversiblem Löschen | ✅ |
| 1.9 | JSDoc-Kommentare (Englisch) alle 20 Provider-Dateien | ✅ |

---

## 2 · Lokalisierung (i18n)

| # | Aufgabe | Status |
|---|---------|--------|
| 2.1 | Extension-UI: Deutsch + Englisch (`src/popup/i18n.js`) | ✅ |
| 2.2 | Browser-Spracherkennung (navigator.language) | ✅ |
| 2.3 | Manuelle Sprach-Umschaltung im Popup (DE/EN-Button Footer) | ✅ |
| 2.4 | Sprachwahl wird in `localStorage` gespeichert | ✅ |
| 2.5 | `README.md` (Englisch) – 20 Provider, korrekte Methoden-Tabelle | ✅ |
| 2.6 | `README.de.md` (Deutsch) – vollständige Übersetzung | ✅ |

---

## 3 · Testing Phase 2A (Live-Probes)

| # | Aufgabe | Status |
|---|---------|--------|
| 3.1 | Alle 20 Provider live getestet (Login + 2× Test-Item + Löschen auf 0) | ✅ |
| 3.2 | `docs/TEST_MATRIX.md` aktualisiert – 20/20 PASS | ✅ |
| 3.3 | Phase 2B (Extension-Button-Test alle Methoden) | 🔧 Post-Release |

Ergebnisse in `docs/TEST_MATRIX.md`.

---

## 4 · Git & GitHub

| # | Aufgabe | Status |
|---|---------|--------|
| 4.1 | Alle Commits lokal auf `main` | ✅ |
| 4.2 | Tag `v1.0.1` auf neuesten Commit zeigend | ✅ |
| 4.3 | **`git push origin main`** — HEAD zu GitHub gepusht | ✅ |
| 4.4 | **`git push origin v1.0.1 --force`** — Tag zu GitHub gepusht | ✅ |
| 4.5 | GitHub Release v1.0.1 mit Release Notes + Artifacts | ✅ |

**Release Notes Vorlage (für Schritt 4.5):**
```
## AI Chat Cleaner v1.0.1

### Neu
- MiniMax Agent (agent.minimax.io) als Provider #19
- Z.ai (chat.z.ai) als Provider #20
- DE/EN Sprachwechsel-Button im Popup
- Sprache wird gespeichert (localStorage)

### Gefixt
- Manifest description ≤132 Zeichen (Chrome Web Store Anforderung)
- Gemini: API-batchexecute-Methode wird jetzt zuerst verwendet

### Assets
- acc-chrome.zip — Chrome / Edge
- acc-firefox.xpi — Firefox (AMO)
- acc-firefox.zip — Firefox Dev
- acc-edge.zip — Edge
- acc-console.js — Konsolen-Skript / Bookmarklet
```

---

## 5 · Chrome Web Store (CWS)

| # | Aufgabe | Status |
|---|---------|--------|
| 5.1 | `dist/acc-chrome.zip` (v1.0.1) hochladen | ⏳ Du |
| 5.2 | Short description (132 Zeichen EN) eintragen | ⏳ Du |
| 5.3 | Full description EN eintragen | ⏳ Du |
| 5.4 | Deutsche Sprache hinzufügen + DE-Beschreibung eintragen | ⏳ Du |
| 5.5 | Screenshot 1 ersetzen (`screenshot-1-popup-1280x800.png`) | ⏳ Du |
| 5.6 | Screenshot 4 hinzufügen (`screenshot-4-platforms-1280x800.png`) | ⏳ Du |
| 5.7 | Small Promo Tile ersetzen (`cws-promo-small-440x280.png`) | ⏳ Du |
| 5.8 | Marquee Promo Tile ersetzen (`cws-promo-marquee-1400x560.png`) | ⏳ Du |
| 5.9 | Privacy: kein Tracking, keine Datenerhebung eintragen | ⏳ Du |
| 5.10 | Zur Review einreichen | ⏳ Du |

Texte stehen in `docs/STORE_SUBMIT.md`.  
Grafiken in `assets/store-graphics/`.

---

## 6 · Firefox AMO

| # | Aufgabe | Status |
|---|---------|--------|
| 6.1 | `dist/acc-firefox.xpi` v1.0.1 hochladen | ⏳ Du |
| 6.2 | Summary + Full description EN eintragen | ⏳ Du |
| 6.3 | Deutsche Beschreibung (DE Locale) eintragen | ⏳ Du |
| 6.4 | Screenshot 1 ersetzen (`screenshot-1-popup-1280x800.png`) | ⏳ Du |
| 6.5 | Screenshot 4 hinzufügen (`screenshot-4-platforms-1280x800.png`) | ⏳ Du |
| 6.6 | Marketing icon: `amo-icon-512x512.png` hochladen | ⏳ Du |
| 6.7 | Source code URL + Build-Befehl eintragen | ⏳ Du |
| 6.8 | Einreichen | ⏳ Du |

---

## 7 · Microsoft Edge Add-ons (optional)

| # | Aufgabe | Status |
|---|---------|--------|
| 7.1 | `dist/acc-edge.zip` hochladen | ⏳ Du (optional) |
| 7.2 | CWS-Texte wiederverwenden | — |

---

## 8 · Ko-fi (`ko-fi.com/aichatcleaner`)

| # | Aufgabe | Status |
|---|---------|--------|
| 8.1 | Ko-fi Creator-Konto + Seite erstellt | ✅ Du |
| 8.2 | Cover aktualisieren (`kofi-cover-1200x400.png` — jetzt "20 platforms") | ⏳ Du |
| 8.3 | Social Preview aktualisieren (`kofi-social-preview-600x300.png`) | ⏳ Du |
| 8.4 | Bio-Text: GitHub + Stores + "20 AI platforms" | ⏳ Du |

---

## 9 · Patreon (`patreon.com/SunnyCueq`)

| # | Aufgabe | Status |
|---|---------|--------|
| 9.1 | Patreon-Seite + Supporter 3 €/Monat-Tier erstellt | ✅ Du |
| 9.2 | Cover aktualisieren (`patreon-cover-1600x400.png` — jetzt "20 platforms") | ⏳ Du |
| 9.3 | About-Text: "20 AI platforms, MIT, kein Tracking" + Links | ⏳ Du |

---

## 10 · Grafiken (alle lokal fertig)

| Datei | Maße | Verwendung | Status |
|-------|------|------------|--------|
| `src/icons/icon-{16,32,48,96,128,512}.png` | je | Extension-Icons | ✅ |
| `assets/acc-logo.png` | 1024×1024 | Basis-Artwork | ✅ |
| `cws-promo-small-440x280.png` | 440×280 | CWS Promo-Tile | ✅ |
| `cws-promo-marquee-1400x560.png` | 1400×560 | CWS Marquee (optional) | ✅ |
| `amo-icon-512x512.png` | 512×512 | AMO Marketing-Icon | ✅ |
| `screenshot-1-popup-1280x800.png` | 1280×800 | Popup-Ansicht | ✅ |
| `screenshot-2-confirm-1280x800.png` | 1280×800 | Confirm-Dialog | ✅ |
| `screenshot-3-progress-1280x800.png` | 1280×800 | Fortschrittsbalken | ✅ |
| `screenshot-4-platforms-1280x800.png` | 1280×800 | 20 Plattformen (neu) | ✅ |
| `kofi-avatar-400x400.png` | 400×400 | Ko-fi Profilbild | ✅ |
| `kofi-cover-1200x400.png` | 1200×400 | Ko-fi Cover | ✅ |
| `kofi-social-preview-600x300.png` | 600×300 | Ko-fi Social Preview | ✅ |
| `patreon-avatar-400x400.png` | 400×400 | Patreon Profilbild | ✅ |
| `patreon-cover-1600x400.png` | 1600×400 | Patreon Cover | ✅ |
| `patreon-tier-supporter-460x200.png` | 460×200 | Patreon Tier-Grafik | ✅ |

---

## Reihenfolge für den Release-Tag

```
1. git push origin main
2. git push origin v1.0.1 --force
3. GitHub Release erstellen (v1.0.1 + Release Notes + ZIP/XPI-Anhänge)
4. CWS: acc-chrome.zip hochladen + Grafiken + Beschreibungen
5. AMO: acc-firefox.xpi hochladen + Grafiken + Beschreibungen
6. Ko-fi + Patreon: aktualisierte Cover hochladen
7. ✅ Release abgeschlossen
```
