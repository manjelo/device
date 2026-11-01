FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Radio-to-radio relay (relay/server.mjs): stateless WebSocket service, production dependencies only.
FROM node:22-alpine AS relay
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY relay/server.mjs ./relay/server.mjs
USER node
EXPOSE 8081
CMD ["node", "relay/server.mjs"]

# Keep runner as the last stage: it is the default target for the static app.
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
