FROM node:20-alpine

WORKDIR /app

# yarn.lock is copied alongside package.json so --frozen-lockfile has something
# to verify against; without it yarn would resolve fresh versions at build time.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 5173

# yarn passes trailing args straight through, so no `--` separator is needed
# (unlike npm, which requires `npm run dev -- --host`).
CMD ["yarn", "dev", "--host", "0.0.0.0"]
