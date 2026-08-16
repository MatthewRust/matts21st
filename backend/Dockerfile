FROM node:20-alpine

WORKDIR /app

# yarn.lock is copied alongside package.json so --frozen-lockfile has something
# to verify against; without it yarn would resolve fresh versions at build time.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 3001

CMD ["yarn", "dev"]
