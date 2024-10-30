# Krakplace bot
This program permits to automatically draw an image on the KrakPlace canva using their API. <br>
Author :  Yoann Balasse
## Disclaimer
This code has been developped for fun, as a Proof of Concept and it doesn't comply with the ToS of the KrakPlace. 
**We do not encourage anyone to use this bot.**
This code is shared for public interest, not to cause any trouble.

## Front end
An HTML JS form to send all the data with a graphical interface.
You need to provide :
- The image file to be drawn
- The X and Y coordinates of the to left corner of the drawing
- The size expected for your drawing

The cookies that are being used by the bot must be specified in a `cookie.json` file using the following structure :
```json
{
    "cookies": [
        "cookie1",
        "cookie2",
        "cookie3",
        ...
    ]
}
```
The bot can use multiple cookies in order to reduce the cooldown effect on the bot. The cooldown seen by the bot is then `10s/nbCookies`.

## Backend
A Node JS app using express to forward the API requests to the API of KrakPlace, and bypass the CORS Same Origin policy.
It also handles the routing to the front end.

# Setup
This bot has been developped to be deployed within a docker container.
This makes the deployment easy. You only have to follow the instructions.

1. Clone the repository <br>
`git clone https://github.com/Nota-yob/Krakplace-bot.git`

2. Add the cookies to a `cookies.json` file

3. Build the docker image (execute inside the cloned repo)<br>
`docker build -t krackbot .`

4. Run the docker container <br>
`docker run -p 8080:8080 krakbot`

5. Visit the form web page at `loclhost:8080` (or replace localhost by the ip/domain name of the server running the container)