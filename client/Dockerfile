# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# === DEBUG: Check build output ===
RUN echo "--- Contents of /app/build after build: ---" && ls -la /app/build
# === END DEBUG ===

# --- Stage 2: Production Stage ---
FROM nginx:stable-alpine

RUN rm -rf /usr/share/nginx/html/*

# Copy the static build output from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# === DEBUG: Check copied files ===
RUN echo "--- Contents of /usr/share/nginx/html after copy: ---" && ls -la /usr/share/nginx/html
# === END DEBUG ===

# Copy the startup script
COPY start-nginx.sh /start-nginx.sh
# Make sure it's executable inside the container
RUN chmod +x /start-nginx.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run our script instead of the default Nginx command
CMD ["/start-nginx.sh"]