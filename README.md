# TIMECRAFT

A cyberpunk-themed time tracker built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies — just open `index.html` in a browser and go.

---

## Features

- **Start / Pause / Commit** workflow — name a task, run the timer, commit it to your log when done
- **Mission Log** — scrollable history of completed sessions with timestamps and durations
- **Stats HUD** — today's tracked time, total session count, all-time total, and XP earned
- **XP & Level system** — earn 1 XP per minute tracked; every 60 XP levels you up through 10 ranks
- **Persistent storage** — sessions survive page refreshes via `localStorage`; no account or server needed
- **Keyboard shortcut** — press `Enter` in the task input to start the timer immediately

---

## Project Structure

```
timecraft/
├── index.html   # Markup and DOM structure
├── style.css    # All styles; design tokens live in :root at the top
├── app.js       # Timer logic, localStorage persistence, rendering
└── README.md
```

---

## Getting Started

No install step. Just open the file:

```bash
# Option 1 — open directly
open index.html

# Option 2 — serve locally (avoids any browser file:// quirks)
npx serve .
# or
python -m http.server 8080
```

---

## How to Use

1. Type a mission name in the input field (optional — defaults to "Unnamed Mission")
2. Click **[ START ]** or press `Enter`
3. Click **[ PAUSE ]** to pause; click **[ RESUME ]** to continue
4. Click **[ COMMIT ]** to save the session to your log
5. Saved sessions appear in the **Mission Log** below — click **[ X ]** to delete individual entries

---

## Customization

### Changing the color scheme

All colors are defined as CSS custom properties at the top of `style.css`:

```css
:root {
  --bg-page:        #060c07;
  --bg-surface:     #0a150b;
  --green-bright:   #00ff88;
  --green-mid:      #00cc66;
  /* ... */
}
```

Swap those values to retheme the entire app without touching the rest of the CSS.

### Adjusting the XP system

At the top of `app.js` there are constants you can change:

```js
const XP_PER_MIN   = 1;    // XP earned per minute tracked
const XP_PER_LEVEL = 60;   // XP required to reach the next level
const MAX_SESSIONS = 100;  // Maximum sessions stored in localStorage
```

### Adding level names

The `LEVELS` array in `app.js` defines the rank names in order. Add, remove, or rename entries freely — the app will cap at the last entry once you exceed the array length.

```js
const LEVELS = [
  'RECRUIT', 'INITIATE', 'OPERATIVE', 'AGENT',   'SPECIALIST',
  'VETERAN', 'ELITE',    'COMMANDER', 'LEGEND',   'MYTHIC'
];
```

---

## Local Storage

Sessions are saved under the key `timecraft-sessions-v1` in your browser's `localStorage`. To wipe all data, click **[ CLEAR ALL ]** in the app, or run this in the browser console:

```js
localStorage.removeItem('timecraft-sessions-v1');
```

---

## Browser Support

Works in any modern browser (Chrome, Firefox, Edge, Safari). No polyfills required.
