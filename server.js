const express = require("express");
const cors = require("cors");
const path = require("path");

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

    console.log(`[${time}] ${type}`, data);
}

// test server
app.get("/test", (req, res) => {
    res.send("OK");
});

// GET
app.get("/api/get", (req, res) => {
    addLog("GET", req.query, req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    res.json({ status: "ok" });
});

// POST
app.post("/api/post", (req, res) => {
    addLog("POST", req.body, req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    res.json({ status: "ok" });
});

// ambil logs
app.get("/logs", (req, res) => {
    res.json(logs);
});

// frontend
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
    console.log("Running on port " + PORT);
});
