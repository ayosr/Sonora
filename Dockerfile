# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

# Dependencies first so the layer caches across source edits.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run test && npm run build

# ---- serve ----
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Run unprivileged: nginx listens on 8080, not 80, and the pid file goes to
# /tmp since /var/run isn't writable by a non-root user. Strip the base
# image's own `pid` directive first so it doesn't collide with the one CMD
# passes via -g (nginx errors on a directive defined twice).
RUN sed -i '/^pid /d' /etc/nginx/nginx.conf \
 && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx \
 && touch /tmp/nginx.pid && chown nginx:nginx /tmp/nginx.pid
USER nginx

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off; pid /tmp/nginx.pid;"]
