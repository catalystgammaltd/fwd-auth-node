FROM node:17 as build-deps
WORKDIR /build
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN yarn build

FROM node:17-alpine3.14 as base
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build-deps /build/dist ./dist
COPY --from=build-deps /build/node_modules node_modules

EXPOSE 3000
CMD ["node", "dist/server.js"]