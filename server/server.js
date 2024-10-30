// server.js
const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = 8080;
const utils = require('./utils.js');

app.use(express.json());

// Add middleware to set CORS headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// Set the static directory for CSS and client assets
app.use(express.static("public"));

// HTML form rendering
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
/*
// Define the proxy endpoint
app.post("/proxy/draw", async (req, res) => {
    const { x, y, color, cookie } = req.body;
    try {
        // Proxy the request to the external API
        const response = await fetch("https://place.liste.bdekraken.fr/api/place/tile/draw", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `krakookie=${cookie}`
            },
            body: JSON.stringify({ x, y, color })
        });

        const data = await response.json();

        if (response.ok) {
            res.status(200).json(data); // Send the response back to the client
        } else {
            res.status(response.status).json(data); // Forward error status and response
        }
    } catch (error) {
        console.error("Error proxying request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
*/

app.post("/proxy/task", async (req, res) => {
    const {startX, startY, imageData} = req.body;

    const cookies = await utils.getCookies();
    if (startX && startY && imageData && cookies) {
        data = {message: "The request has been received by the bot"};
        res.status(200).json(data);
    }else {
        console.error("Error processing request: invalid body or no cookies");
        res.status(500).json({ message: "Error processing request: invalid body or no cookie" });
    }
    utils.drawImage(imageData, startX, startY, cookies)
    .then((message)=> {
        console.log(message);
    })
    .catch((error)=> {
        console.error("Fatal error drawing the image :", error);
    })
});

// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
