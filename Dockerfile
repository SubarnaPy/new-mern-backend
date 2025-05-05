FROM node:22.14.0

# Install required dependencies
RUN apt-get update && apt-get install -y openjdk-17-jdk g++ gcc python3

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all other files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start your application
CMD ["node", "server.js"]
