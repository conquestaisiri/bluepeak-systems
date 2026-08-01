FROM node:22-alpine
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter ./artifacts/api-server --filter ./lib/db --filter ./lib/api-zod --filter ./lib/api-spec --filter ./lib/api-client-react

# Copy source code
COPY . .

# Build API server
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Run the server
EXPOSE 8080
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]