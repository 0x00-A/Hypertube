# syntax=docker/dockerfile:1
# ---------------------------------------------------------
# Build Stage
# ---------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Set build-time env vars
# Note: Since we are using an identical origin proxy for `/api`,
# we can rely on relative URLs or matching domain defaults
ENV VITE_API_URL="/api/v1"

# Copy source code and build
COPY . .
RUN npm run build

# ---------------------------------------------------------
# Production Stage
# ---------------------------------------------------------
FROM nginx:alpine AS runtime

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (standard HTTP port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]