FROM node:20-alpine

WORKDIR /app

# Install workspace dependencies first for better layer caching.
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install

# Copy backend sources.
COPY backend ./backend

WORKDIR /app/backend

EXPOSE 5175

CMD ["sh", "-c", "npx tsx src/scripts/ensureRuntimeSchema.ts && npx tsx src/index.ts"]
