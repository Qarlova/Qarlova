const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let logs = [];
let LogUser = "";

// ================= LOAD FILE SAAT START =================
try {
    if (fs.existsSync("databaselua.lua")) {
        const content = fs.readFileSync("databaselua.lua", "utf-8");

        const match = content.match(/LogUser = LogUser\.\."([\s\S]*)"/);
        if (match) {
            LogUser = match[1];
        }

        console.log("databaselua.lua loaded");
    }
} catch (e) {
    console.log("gagal load databaselua.lua");
}

// ================= LOG SYSTEM =================
function addLog(type, data, ip) {
    const time = new Date().toLocaleString();
    const appName = data.app || "GROWLAUNCHER/BOTHAX";
    const user = data.nama || "Unknown";

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

    // ================= LUA DATABASE =================
    LogUser += "\\nadd_label_with_icon|small|`w" + user + "|left|7188|\\n";

    const luaContent = `LogUser = ""
LogUser = LogUser.."${LogUser}"`;

    fs.writeFileSync("databaselua.lua", luaContent);

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

body {
    margin: 0;
    font-family: system-ui;
    background: var(--bg);
    color: white;
}

.header {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    background: var(--card);
}

.btn {
    padding: 6px 10px;
    margin-left: 5px;
    border: none;
    border-radius: 6px;
    background: var(--accent);
    color: black;
    cursor: pointer;
}

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

.terminal {
    display: none;
    padding: 10px;
    font-family: monospace;
    color: var(--accent);
    font-size: 12px;
}

.get { color: #00bfff; }
.post { color: #ffcc00; }

@media (max-width: 500px) {
    .gui {
        grid-template-columns: 1fr;
    }
}
</style>
</head>
<body>

<div class="header">
    <div>Admin Panel</div>
    <div>
        <button class="btn" onclick="setMode('gui')">GUI</button>
        <button class="btn" onclick="setMode('terminal')">Terminal</button>
    </div>
</div>

<div id="gui" class="gui"></div>
<div id="terminal" class="terminal"></div>

<script>
let lastLength = 0;

const gui = document.getElementById("gui");
const terminal = document.getElementById("terminal");

function setMode(m) {
    gui.style.display = m === "gui" ? "grid" : "none";
    terminal.style.display = m === "terminal" ? "block" : "none";
}

setMode("gui");

function addCard(log) {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = \`
    <div><b>Nama:</b> \${log.data.nama || "-"}</div>
    <div><b>UID:</b> \${log.data.uid || "-"}</div>
    <div><b>World:</b> \${log.data.world || "-"}</div>
    <div><b>APP:</b> \${log.data.APP}</div>
    \`;

    gui.appendChild(card);
}

function addTerminal(log) {
    const div = document.createElement("div");

    div.innerHTML = \`
    [\${log.time}] 
    <span class="\${log.type === "GET" ? "get" : "post"}">\${log.type}</span>
    → \${JSON.stringify(log.data)}
    \`;

    terminal.appendChild(div);
}

async function loadLogs() {
    const res = await fetch("/logs");
    const data = await res.json();

    if (data.length > lastLength) {
        for (let i = lastLength; i < data.length; i++) {
            addCard(data[i]);
            addTerminal(data[i]);
        }
        lastLength = data.length;
    }
}

setInterval(loadLogs, 1000);
loadLogs();
</script>

</body>
</html>
`);
});

// ================= API =================
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

// 🔥 endpoint ambil file lua
app.get("/databaselua.lua", (req, res) => {
    if (fs.existsSync("databaselua.lua")) {
        res.sendFile(__dirname + "/databaselua.lua");
    } else {
        res.send("LogUser = \"\"");
    }
});

app.listen(PORT, () => {
    console.log("Running on port " + PORT);
});
