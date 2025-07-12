# Use Node.js 18 Alpine as base image
FROM node:18-alpine3.19

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Prisma schema first (needed for prisma generate in postinstall)
COPY prisma ./prisma

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Create necessary directories and set permissions
RUN mkdir -p /app/uploads/faces && chown -R nodeuser:nodejs /app/uploads
RUN mkdir -p /app/prisma && chown -R nodeuser:nodejs /app/prisma

# Generate Prisma client
RUN npx prisma generate

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
