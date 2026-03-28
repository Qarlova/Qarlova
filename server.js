const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let logs = [];

// ================= LOG SYSTEM =================
function addLog(type, data, ip) {
    const time = new Date().toLocaleString();

    const appName = data.app || "GROWLAUNCHER/BOTHAX";

    logs.push({
        time,
        type,
        ip,
        data: {
            ...data,
            APP: appName
        }
    });

    if (logs.length > 300) logs.shift();

    console.log(`[${time}] ${type} ${ip}`, data);
}

// ================= UI =================
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Log Panel</title>

<style>
:root {
    --bg: #0d1117;
    --card: #161b22;
    --accent: #00ff9c;
}

* { box-sizing: border-box; }

body {
    margin: 0;
    font-family: system-ui;
    background: var(--bg);
    color: white;
}

/* HEADER */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--card);
    position: sticky;
    top: 0;
    z-index: 10;
}

.header h2 {
    margin: 0;
    font-size: 16px;
}

/* BUTTON */
.btn {
    padding: 6px 10px;
    margin-left: 5px;
    border: none;
    border-radius: 6px;
    background: var(--accent);
    color: black;
    cursor: pointer;
    font-size: 12px;
}

/* TERMINAL */
.terminal {
    display: none;
    padding: 10px;
    font-family: monospace;
    color: var(--accent);
    font-size: 12px;
}

.log {
    margin-bottom: 5px;
}

/* GUI */
.gui {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
    padding: 10px;
}

.card {
    background: var(--card);
    padding: 10px;
    border-radius: 10px;
    font-size: 12px;
}

.card b {
    color: var(--accent);
}

/* COLORS */
.get { color: #00bfff; }
.post { color: #ffcc00; }

/* MOBILE */
@media (max-width: 500px) {
    .header h2 { font-size: 14px; }
    .btn { font-size: 11px; padding: 5px; }
}
</style>
</head>
<body>

<div class="header">
    <h2>Admin Log Panel</h2>
    <div>
        <button class="btn" onclick="setMode('gui')">GUI</button>
        <button class="btn" onclick="setMode('terminal')">Terminal</button>
        <button class="btn" onclick="clearLogs()">Clear</button>
    </div>
</div>

<div id="gui" class="gui"></div>
<div id="terminal" class="terminal"></div>

<script>
let mode = "gui";
let lastLength = 0;

const gui = document.getElementById("gui");
const terminal = document.getElementById("terminal");

function setMode(m) {
    mode = m;
    gui.style.display = m === "gui" ? "grid" : "none";
    terminal.style.display = m === "terminal" ? "block" : "none";
}

setMode("gui");

// terminal view
function addTerminal(log) {
    const div = document.createElement("div");
    div.className = "log";

    div.innerHTML = \`
    [\${log.time}] 
    <span class="\${log.type === "GET" ? "get" : "post"}">\${log.type}</span>
    → \${JSON.stringify(log.data)}
    (APP: \${log.data.APP})
    \`;

    terminal.appendChild(div);
}

// gui view
function addCard(log) {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = \`
    <div><b>Type:</b> <span class="\${log.type === "GET" ? "get" : "post"}">\${log.type}</span></div>
    <div><b>Time:</b> \${log.time}</div>
    <div><b>IP:</b> \${log.ip}</div>
    <div><b>Nama:</b> \${log.data.nama || "-"}</div>
    <div><b>UID:</b> \${log.data.uid || "-"}</div>
    <div><b>World:</b> \${log.data.world || "-"}</div>
    <div><b>APP:</b> \${log.data.APP || "-"}</div>
    \`;

    gui.appendChild(card);
}

// load logs
async function loadLogs() {
    try {
        const res = await fetch("/logs");
        const data = await res.json();

        if (data.length > lastLength) {
            for (let i = lastLength; i < data.length; i++) {
                addTerminal(data[i]);
                addCard(data[i]);
            }
            lastLength = data.length;
            terminal.scrollTop = terminal.scrollHeight;
        }
    } catch (e) {}
}

function clearLogs() {
    gui.innerHTML = "";
    terminal.innerHTML = "";
    lastLength = 0;
}

setInterval(loadLogs, 1000);
loadLogs();
</script>

</body>
</html>
`);
});

// ================= API =================

app.get("/test", (req, res) => {
    res.send("OK");
});

app.get("/api/get", (req, res) => {
    addLog("GET", req.query, req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    res.json({ status: "ok" });
});

app.post("/api/post", (req, res) => {
    addLog("POST", req.body, req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    res.json({ status: "ok" });
});

app.get("/logs", (req, res) => {
    res.json(logs);
});

app.listen(PORT, () => {
    console.log("Running on port " + PORT);
});
