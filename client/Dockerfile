# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
# Install serve globally for serving static files
RUN npm install -g serve
# Copy built app from build stage
COPY --from=build /app/dist ./dist
EXPOSE 5173
USER node
# Serve the built app on port 5173
CMD ["serve", "-s", "dist", "-l", "5173"]