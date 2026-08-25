FROM node:22-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend API port
EXPOSE 5000

# Default entrypoint for API Service
CMD ["npm", "start"]
