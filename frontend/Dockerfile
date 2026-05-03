FROM node:20-alpine AS build

WORKDIR /app

# Install workspace dependencies first for better layer caching.
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install

# Build frontend static assets without running TypeScript test typechecks.
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npx vite build

FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 4173

CMD ["nginx", "-g", "daemon off;"]
