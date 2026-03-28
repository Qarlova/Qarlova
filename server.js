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

// ================= LOAD LUA FILE =================
try {
    if (fs.existsSync("databaselua.lua")) {
        const content = fs.readFileSync("databaselua.lua", "utf-8");
        const match = content.match(/LogUser = LogUser\.\."([\s\S]*)"/);
        if (match) LogUser = match[1];
    }
} catch (e) {}

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

    // LUA DATABASE
    LogUser += "\\nadd_label_with_icon|small|`w" + user + "|left|7188|\\n";

    const luaContent = `LogUser = ""
LogUser = LogUser.."${LogUser}"`;

    fs.writeFileSync("databaselua.lua", luaContent);
}

// ================= UNIVERSAL TEXT DB =================
function addUniversalText(text) {
    const time = new Date().toLocaleString();
    const line = `[${time}] ${text}\\n`;

    fs.appendFileSync("database.txt", line);
}

// ================= UI =================
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Panel</title>

<style>
body { margin:0; background:#0d1117; color:white; font-family:sans-serif; }

.header {
    display:flex; justify-content:space-between;
    padding:10px; background:#161b22;
}

.btn {
    padding:5px 10px; margin-left:5px;
    border:none; background:#00ff9c; cursor:pointer;
}

.gui {
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
    gap:10px; padding:10px;
}

.card {
    background:#161b22;
    padding:10px; border-radius:8px;
    font-size:12px;
}

.terminal {
    display:none;
    padding:10px;
    font-family:monospace;
    color:#00ff9c;
}

.get { color:#00bfff; }
.post { color:#ffcc00; }
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
    gui.style.display = m==="gui"?"grid":"none";
    terminal.style.display = m==="terminal"?"block":"none";
}

setMode("gui");

function addCard(log){
    const d=document.createElement("div");
    d.className="card";
    d.innerHTML=\`
    <div>Nama: \${log.data.nama||"-"}</div>
    <div>UID: \${log.data.uid||"-"}</div>
    <div>World: \${log.data.world||"-"}</div>
    <div>APP: \${log.data.APP}</div>
    \`;
    gui.appendChild(d);
}

function addTerminal(log){
    const d=document.createElement("div");
    d.innerHTML=\`
    [\${log.time}]
    <span class="\${log.type==="GET"?"get":"post"}">\${log.type}</span>
    → \${JSON.stringify(log.data)}
    \`;
    terminal.appendChild(d);
}

async function loadLogs(){
    const res=await fetch("/logs");
    const data=await res.json();

    if(data.length>lastLength){
        for(let i=lastLength;i<data.length;i++){
            addCard(data[i]);
            addTerminal(data[i]);
        }
        lastLength=data.length;
    }
}

setInterval(loadLogs,1000);
loadLogs();
</script>

</body>
</html>
`);
});

// ================= API =================

// log utama
app.get("/api/get", (req, res) => {
    addLog("GET", req.query, req.ip);
    res.json({ status: "ok" });
});

app.post("/api/post", (req, res) => {
    addLog("POST", req.body, req.ip);
    res.json({ status: "ok" });
});

// universal text
app.get("/api/addtext", (req, res) => {
    const text = req.query.text || "no_text";
    addUniversalText(text);
    res.json({ status: "ok" });
});

app.post("/api/addtext", (req, res) => {
    const text = req.body.text || "no_text";
    addUniversalText(text);
    res.json({ status: "ok" });
});

// ambil logs
app.get("/logs", (req, res) => {
    res.json(logs);
});

// ambil lua
app.get("/databaselua.lua", (req, res) => {
    if (fs.existsSync("databaselua.lua")) {
        res.sendFile(__dirname + "/databaselua.lua");
    } else {
        res.send("LogUser = \"\"");
    }
});

// ambil text db
app.get("/database.txt", (req, res) => {
    if (fs.existsSync("database.txt")) {
        res.sendFile(__dirname + "/database.txt");
    } else {
        res.send("Database kosong");
    }
});

app.listen(PORT, () => {
    console.log("Running on port " + PORT);
});
