# Use the official Node.js image
FROM node:16

# Create and set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the application files
COPY ../ .

# Expose the server's port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]