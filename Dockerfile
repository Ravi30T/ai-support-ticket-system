# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for building)
RUN npm ci

# Copy application source code
COPY . .

# Build the NestJS application
RUN npm run build

# Prune dev dependencies (keep only production dependencies)
RUN npm prune --production

# Stage 2: Run the application
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy built files and production dependencies from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Expose the application port (defaults to 3000 in code)
EXPOSE 3000

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the NestJS application
CMD ["node", "dist/main"]
