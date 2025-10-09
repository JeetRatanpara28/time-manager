# Dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build Vue app with API URL baked in at build time
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Install static server
RUN npm install -g serve

# Use Fly-provided port
ENV PORT=5173
EXPOSE $PORT

# Start static server on all interfaces; use -l with host:port because
# newer 'serve' CLI does not accept a --host flag (ARG_UNKNOWN_OPTION).
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-5173}"]
