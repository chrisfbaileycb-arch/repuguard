FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci && cd backend && npm ci
COPY . .
RUN npx vite build
EXPOSE 3000
CMD ["node", "backend/server.js"]
