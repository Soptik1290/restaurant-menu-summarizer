# --- Stage 1: Build Stage ---
# Use a Node.js version compatible with NestJS
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies including devDependencies needed for build
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# --- Stage 2: Production Stage ---
# Use a smaller Node.js image for production
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy only necessary files from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port the app runs on (defined in main.ts)
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/main"]