FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile && pnpm build
FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY --from=build /app .
ENV PORT=8787
EXPOSE 8787
CMD ["pnpm","start"]
