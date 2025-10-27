FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN npm install -g bun && bun install

# Copy application code
COPY . .

# Expose port 5173
EXPOSE 5173

# Set environment variable for production mode in Docker
ENV NODE_ENV=production

# Start development server
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
