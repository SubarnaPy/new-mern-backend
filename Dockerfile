# Use an official Node.js image as the base image
FROM node:18

# Install required dependencies like OpenJDK, gcc, g++, etc.
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk g++ gcc python3

# Set the working directory to /app inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the project files into the container
COPY . .

# Expose port 3000 (or your app's port)
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]  # Change this to your app's entry file
