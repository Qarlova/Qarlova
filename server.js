const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

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

// ================= API CUSTOM =================
app.get("/api/*", (req, res) => {
    try {
        const raw = req.params[0]; // ambil semua setelah /api/

        // parse manual: nama=tegar&uid=123
        let data = {};
        raw.split("&").forEach(pair => {
            const [key, value] = pair.split("=");
            if (key && value) {
                data[key] = decodeURIComponent(value);
            }
        });

        const nama = data.nama || "Unknown";
        const uid = data.uid || "-";
        const world = data.world || "-";

        const time = new Date().toLocaleString();

        // simpan ke log panel
        logs.push({
            time,
            data
        });

        if (logs.length > 200) logs.shift();

        // ================= LUA =================
        LogUser += "\\nadd_label_with_icon|small|`w" + nama + "|left|7188|\\n";

        const luaContent = `LogUser = ""
LogUser = LogUser.."${LogUser}"`;

        fs.writeFileSync("databaselua.lua", luaContent);

        res.send("OK");
    } catch (e) {
        res.send("ERROR");
    }
});

// ================= UI =================
app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lua Panel</title>
<style>
body { background:#0d1117; color:white; font-family:sans-serif; margin:0; }
.card { background:#161b22; margin:10px; padding:10px; border-radius:8px; }
</style>
</head>
<body>

<h3 style="padding:10px;">Lua Log Panel</h3>
<div id="logs"></div>

<script>
let last = 0;

async function load(){
    const res = await fetch("/logs");
    const data = await res.json();

    if(data.length > last){
        for(let i=last;i<data.length;i++){
            const d = document.createElement("div");
            d.className="card";
            d.innerHTML =
                "Nama: " + (data[i].data.nama||"-") + "<br>" +
                "UID: " + (data[i].data.uid||"-") + "<br>" +
                "World: " + (data[i].data.world||"-");
            document.getElementById("logs").appendChild(d);
        }
        last = data.length;
    }
}

setInterval(load,1000);
load();
</script>

</body>
</html>`);
});

// ================= DATA =================
app.get("/logs", (req, res) => {
    res.json(logs);
});

// ================= LUA FILE =================
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
