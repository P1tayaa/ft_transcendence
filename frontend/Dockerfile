# Use an official Node.js runtime as a parent image
FROM node:23

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application - Overwritten in DEV
COPY . .

# Define the command to run the app
CMD ["npm", "run", "dev"]