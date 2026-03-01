# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Install ffmpeg for video transcoding
RUN apk add --no-cache ffmpeg
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# Copy email templates (not compiled by TypeScript)
COPY src/templates/emails ./dist/src/templates/emails
# Copy swagger yaml specs
COPY src/docs ./src/docs
# Copy static directories for file serving
COPY public ./public
COPY uploads ./uploads
# Create directories if they don't exist and set proper permissions
RUN mkdir -p /app/public/subtitles /app/uploads/avatars /app/downloads && \
    chown -R node:node /app/public /app/uploads /app/downloads /app/dist/src/templates
EXPOSE 3000
USER node
CMD ["node", "dist/src/server.js"]
