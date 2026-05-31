FROM node:22-alpine

# Install native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency files first for layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

EXPOSE 3000

# Default: run dev server for hot-reload
CMD ["npm", "run", "dev"]
