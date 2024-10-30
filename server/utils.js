const { resolve } = require('path');

const fs = require('fs').promises;

async function getCookies() {
    try {
        // Read and parse the JSON file
        const data = await fs.readFile('cookies.json', 'utf8');
        const json = JSON.parse(data);

        // Check if cookies key exists, is an array, and contains at least one cookie
        if (Array.isArray(json.cookies) && json.cookies.length > 0) {
            return json.cookies;
        } else {
            throw new Error("No cookies found in the file or invalid format.");
        }
    } catch (error) {
        console.error("Error reading cookies:", error);
        throw error; // Re-throw the error to handle it higher up in your code
    }
}
const fetch = require('node-fetch');

async function drawImage(imageData, startX, startY, cookies) {
    const MAX_FAIL = 10; // Max retries per pixel
    const cooldown = (10 * 1000) / cookies.length; // Cooldown in milliseconds
    let cookieIndex = 0;
    // Function to introduce a delay
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


    // Loop through the image data
    for (let y = 0; y < imageData.length; y++) {
        for (let x = 0; x < imageData[y].length; x++) {
            const color = imageData[y][x];
            const posX = startX + x;
            const posY = startY + y;
            const cookie = cookies[cookieIndex];
            
            if (color == null) continue;
            let body;

            try {
                const result = await getPixelInfo(posX, posY, cookie);
                body = await result.json();
                const tile = posX + posY * 255;
                // Check for conditions to skip the iteration
                if (result.status === 404 && body.message === "Tile not found" && color == "#ffffff") {
                    console.log(`Skipping pixel at (${posX}, ${posY}) : tile ${tile} not found`);
                    continue; // Skip if tile not found
                }
                
                if (result.ok && body.color === color) {
                    console.log(`Skipping pixel at (${posX}, ${posY}) : tile ${tile} color already is ${body.color}`);
                    continue; // Skip if color matches
                }
            } catch (error) {
                console.error(`Error fetching pixel info at (${posX}, ${posY}) tile ${tile}:`, error);
                continue; // Skip iteration on error
            }

            let attempts = 0;
            let success = false;

            // Try to place each pixel until successful or MAX_FAIL is reached
            while (!success && attempts < MAX_FAIL) {
                
                // Prepare payload
                const payload = JSON.stringify({ x: posX, y: posY, color: color });
                try {
                    const result = await drawPixel(payload, cookie);
                    if (result.success) {
                        console.log(`Successfully placed pixel at (${posX}, ${posY}) with color ${color}`);
                        success = true;
                    } else {
                        console.error(`Attempt ${attempts + 1}: Failed to place pixel at (${posX}, ${posY}) using cookie ${cookie}:`, result);
                    }
                } catch (error) {
                    console.error(`Attempt ${attempts + 1}: Error placing pixel at (${posX}, ${posY}) using cookie ${cookie}:`, error);
                }

                attempts++;
                cookieIndex = (cookieIndex + 1) % cookies.length;

                // If we've exhausted attempts, throw a fatal error
                if (attempts === MAX_FAIL && !success) {
                    throw new Error(`Fatal error: Failed to place pixel at (${posX}, ${posY}) after ${MAX_FAIL} attempts`);
                }

                // Wait for cooldown before the next iteration
                await wait(cooldown);
            }
        }
    }
    return {message : "Image has been drawn successfully"};
}

async function drawPixel(payload, cookie) {
    try {
        const response = await fetch("https://place.liste.bdekraken.fr/api/place/tile/draw", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `krakookie=${cookie}`
            },
            body: payload
        });

        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Try to parse the JSON body
        const result = await response.json();

        // Log the result for debugging
        
        return result;
    } catch (error) {
        console.log(`Error in drawPixel: ${error.message}`);
        throw error; // rethrow the error to handle it upstream
    }
}

async function getPixelInfo(x, y, cookie) {
    const tile = x + y * 255; // Adjust this logic according to the API's expected tile calculation
    try {
        const response = await fetch(`https://place.liste.bdekraken.fr/api/place/tile/${tile}`, {
            method: "GET",
            headers: {
                "Cookie": `krakookie=${cookie}`
            }
        });

        // Check if the response is ok (status in the range 200-299)
        if (response.status != 200 && response.status != 404) {
            // If response is not ok, throw an error with status for further handling
            console.error(`Error fetching pixel info: ${response.status} ${response.statusText}`);
        }

        return response; // Return the response object for further processing
    } catch (error) {
        console.error(`Failed to fetch pixel info at (${x}, ${y}):`, error);
        throw error; // Rethrow the error to handle it in the calling function
    }
}


// Helper function to add a timeout to the fetch requests
async function fetchWithTimeout(url, options, timeout = 5000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), timeout)
        )
    ]);
}


module.exports = {
    drawImage,
    getCookies
}
