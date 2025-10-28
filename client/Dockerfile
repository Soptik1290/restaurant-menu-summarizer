# --- Stage 1: Build Stage ---
# Use Node.js to build the React app
FROM node:20-alpine AS builder

WORKDIR /app

# ---> KEY CHANGE: Set default value for API URL <---
# This defines an argument that can be passed during the build
# We set a default relative path '/api' which Nginx will handle
ARG REACT_APP_API_URL=/api

COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# ---> USE ARGUMENT DURING BUILD <---
# Set the environment variable *before* building, using the build argument's value
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
# Optional: Log the value being used during the build
RUN echo "Building client with API URL: ${REACT_APP_API_URL}"

# Build the static files (this command will now use the /api ENV variable)
RUN npm run build

# --- Stage 2: Production Stage ---
# Use a lightweight Nginx image
FROM nginx:stable-alpine

# Remove any default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the static build output from the builder stage to Nginx's web root
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the startup script
COPY start-nginx.sh /start-nginx.sh
# Make sure it's executable inside the container
RUN chmod +x /start-nginx.sh

# Expose port 80 (standard HTTP port for Nginx)
EXPOSE 80

# Run our script instead of the default Nginx command
CMD ["/start-nginx.sh"]