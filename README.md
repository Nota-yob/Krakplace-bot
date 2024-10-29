# Krakplace bot
This program permits to automatically draw an image on the KrakPlace canva using their API.
Author :  Yoann Balasse

## Front end
An HTML JS page to send all the data with a graphical interface.
You need to provide :
- Your cookie
- The image file to be drawn
- The X and Y coordinates of the to left corner of the drawing
A cooldown is being added, randomly between 10 and 20 seconds to not be blocked by the KrakPlace cooldown.
The image size that you want to draz can be changed at the top of the server.js file.

## Backend
A Node JS app using express to forward the API requests to the API of KrakPlace, and bypass the CORS Same Origin policy.
