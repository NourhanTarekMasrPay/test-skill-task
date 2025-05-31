# Stage 1: Build the Nest.js application

FROM node:18-alpine AS build 
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


# Stage 2: Run the Nest.js application

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev
EXPOSE 3000 
CMD ["node", "dist/main"]