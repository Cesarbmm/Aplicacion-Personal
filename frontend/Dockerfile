FROM node:22-alpine

WORKDIR /app

COPY frontend/package*.json ./frontend/

WORKDIR /app/frontend
RUN npm ci

WORKDIR /app
COPY frontend ./frontend
COPY assets ./assets

WORKDIR /app/frontend

ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

EXPOSE 5180

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5180"]
