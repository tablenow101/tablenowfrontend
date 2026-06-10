# TableNow frontend (React + Vite) — build statique servi par nginx.
# Les variables VITE_* sont injectées au BUILD (Vite les inline dans le bundle).
# => si tu changes les clés Supabase ou le domaine, il faut REBUILD le front.
FROM node:20-bookworm-slim AS build
WORKDIR /app

ARG VITE_API_URL=https://api.tablenow.io
ARG VITE_SUPABASE_URL=https://placeholder.supabase.co
ARG VITE_SUPABASE_ANON_KEY=placeholder_anon_key
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
