FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/index.js"]
