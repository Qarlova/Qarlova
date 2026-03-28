const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let logs = [];

// format log
function addLog(type, data, ip) {
    const time = new Date().toLocaleString();
    logs.push({
        time,
        type,
        ip,
        data
    });

    if (logs.length > 100) logs.shift(); // limit biar ringan
}

// GET endpoint
app.get("/api/get", (req, res) => {
    addLog("GET", req.query, req.ip);

    res.json({
        status: "ok",
        received: req.query
    });
});

// POST endpoint
app.post("/api/post", (req, res) => {
    addLog("POST", req.body, req.ip);

    res.json({
        status: "ok",
        received: req.body
    });
});

// ambil log
app.get("/logs", (req, res) => {
    res.json(logs);
});

// UI
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.listen(PORT, () => {
    console.log("Server jalan di http://localhost:" + PORT);
});
