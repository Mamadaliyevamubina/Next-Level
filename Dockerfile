# The React app (client/) for Coolify or any Docker host: built once, then served by nginx.
# In Coolify: Build Pack "Dockerfile", Base Directory "/", Port 80.
# The API address is baked in at build time; change it with the build variable VITE_API_URL.

FROM node:20-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json client/
RUN cd client && npm ci
COPY client client
# Question images, the favicon and site.css live in the repo-level public/ folder (vite.config.js: publicDir '../public').
COPY public public
# Question banks for open practice (copied to /data/ by vite.config.js).
COPY data data
ARG VITE_API_URL=https://next-level-api.dombit.uz
ENV VITE_API_URL=$VITE_API_URL
RUN cd client && npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
