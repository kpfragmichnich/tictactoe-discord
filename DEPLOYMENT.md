# 🚀 Discord TicTacToe Deployment Guide

## Schritt 1: GitHub Repository Setup

### 1.1 Repository erstellen
```bash
# In deinem TacTacToe Game Ordner
git init
git add .
git commit -m "Initial Discord TicTacToe Activity"

# Erstelle Repository auf GitHub: https://github.com/new
# Name: tictactoe-discord
# Dann verbinden:
git remote add origin https://github.com/kpfragmichnich/tictactoe-discord.git
git branch -M main
git push -u origin main
```

### 1.2 GitHub Pages aktivieren
1. Gehe zu deinem Repository: https://github.com/kpfragmichnich/tictactoe-discord
2. **Settings** → **Pages**
3. **Source**: `GitHub Actions`
4. Der Workflow wird automatisch dein Spiel bauen und deployen

**Deine URL wird sein:** `https://kpfragmichnich.github.io/tictactoe-discord`

---

## Schritt 2: Discord Application Setup

### 2.1 Discord Developer Portal
1. Gehe zu: https://discord.com/developers/applications
2. **"New Application"** → Name: `TicTacToe Game`
3. Kopiere die **Application ID**: `1404512938898886796` ✅ (du hast sie schon)

### 2.2 Activities konfigurieren
1. **Activities** → **Settings** (linke Seite)
2. **"Enable Activities"** aktivieren
3. **URL Mappings** hinzufügen:
   ```
   Target: https://kpfragmichnich.github.io/tictactoe-discord
   Mappings: /
   ```
4. **"Save Changes"**

### 2.3 OAuth2 Scopes
1. **OAuth2** → **General**
2. **Scopes** auswählen:
   - `identify`
   - `guilds`
   - `rpc.activities.write`
   - `rpc.voice.read`

---

## Schritt 3: Deployment testen

### 3.1 Nach dem Push
1. Push deinen Code zu GitHub
2. Warte ca. 2-3 Minuten bis GitHub Actions fertig ist
3. Check: https://kpfragmichnich.github.io/tictactoe-discord
4. Du solltest das TicTacToe Spiel sehen (im "Standalone Modus")

### 3.2 In Discord testen
1. **Discord Desktop App** öffnen
2. **User Settings** → **Advanced** → **Developer Mode** AN
3. Gehe in einen **Voice Channel**
4. Klicke auf **Activities** (Raketensymbol 🚀)
5. Deine App sollte da sein: **"TicTacToe Game"**

---

## Schritt 4: Fehlerbehandlung

### 4.1 "Activity nicht sichtbar"
- Developer Mode aktiviert? ✅
- In einem Voice Channel? ✅
- URL Mapping korrekt? ✅
- Activities in Discord App aktiviert? ✅

### 4.2 "Game lädt nicht"
- GitHub Pages URL erreichbar? 
- HTTPS funktioniert?
- Browser Console checken (F12)

### 4.3 "Multiplayer funktioniert nicht"
- Mindestens 2 Personen im Voice Channel
- Beide klicken auf die Activity
- Console Logs checken

---

## Schritt 5: Production Setup

### 5.1 Environment Variables für Production
Erstelle `.env.production`:
```bash
VITE_DISCORD_CLIENT_ID=1404512938898886796
VITE_API_BASE_URL=https://kpfragmichnich.github.io/tictactoe-discord
VITE_ENVIRONMENT=production
```

### 5.2 Vite Config anpassen
In `vite.config.js` ist bereits alles für GitHub Pages konfiguriert:
- Base URL: `/tictactoe-discord/`
- HTTPS für Discord Activities
- Optimierte Builds

---

## 🎮 Wie es funktioniert

### In Discord:
1. **2 Spieler** joinen Voice Channel
2. **Activities** → **TicTacToe Game** starten  
3. **Erste 2 Personen** = Spieler, Rest = Zuschauer
4. **Discord Namen** werden angezeigt
5. **Turnbasiert** - nur aktueller Spieler kann klicken
6. **Zufälliger Startspieler** pro Runde

### Features:
- ✅ Discord-Namen statt "Spieler 1/2"
- ✅ Turnbeschränkung (nur aktiver Spieler)
- ✅ Zuschauer-Modus
- ✅ Glassmorphic Design mit Dark/Light Mode
- ✅ Custom Board-Größen & Symbole
- ✅ Smooth Animationen
- ✅ Scoreboard über mehrere Runden

---

## Quick Test Commands

```bash
# Repository klonen und testen
git clone https://github.com/kpfragmichnich/tictactoe-discord.git
cd tictactoe-discord
npm install
npm run build
npm run preview  # Lokaler Test des Production Builds

# Force Push (wenn nötig)
git push --force-with-lease origin main
```

**🎯 Deine Live URL:** https://kpfragmichnich.github.io/tictactoe-discord

Ready für Discord! 🚀
