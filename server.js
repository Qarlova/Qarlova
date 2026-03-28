const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let logs = [];

// tambah log
function addLog(type, data, ip) {
    const time = new Date().toLocaleString();

    logs.push({
        time,
        type,
        ip,
        data
    });

    if (logs.length > 200) logs.shift();

    console.log(`[${time}] ${type} ${ip}`, data);
}

// ✅ ROOT (HTML langsung)
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Logs Panel</title>

<style>
body {
    margin: 0;
    background: #0d1117;
    color: #00ff9c;
    font-family: monospace;
}

.terminal {
    height: 100vh;
    overflow-y: auto;
    padding: 10px;
    font-size: 13px;
}

.log {
    margin-bottom: 6px;
    word-break: break-word;
}

.get { color: #00bfff; }
.post { color: #ffcc00; }

.terminal::after {
    content: "_";
    animation: blink 1s infinite;
}

@keyframes blink {
    0% {opacity: 1;}
    50% {opacity: 0;}
    100% {opacity: 1;}
}
</style>
</head>
<body>

<div class="terminal" id="terminal"></div>

<script>
const terminal = document.getElementById("terminal");
let lastLength = 0;

function appendLog(log) {
    const div = document.createElement("div");
    div.className = "log";

    const typeClass = log.type === "GET" ? "get" : "post";

    div.innerHTML = \`
    [\${log.time}] 
    <span class="\${typeClass}">\${log.type}</span> 
    \${log.ip} → \${JSON.stringify(log.data)}
    \`;

    terminal.appendChild(div);
}

async function loadLogs() {
    try {
        const res = await fetch("/logs");
        const data = await res.json();

        if (data.length > lastLength) {
            for (let i = lastLength; i < data.length; i++) {
                appendLog(data[i]);
            }
            lastLength = data.length;
            terminal.scrollTop = terminal.scrollHeight;
        }
    } catch (e) {}
}

setInterval(loadLogs, 1000);
loadLogs();
</script>

</body>
</html>
    `);
});

// test
app.get("/test", (req, res) => {
    res.send("OK");
});

// GET API
app.get("/api/get", (req, res) => {
    addLog("GET", req.query, req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    res.json({ status: "ok" });
});

// POST API
app.post("/api/post", (req, res) => {
    addLog("POST", req.body, req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    res.json({ status: "ok" });
});

// logs endpoint
app.get("/logs", (req, res) => {
    res.json(logs);
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
