FROM node:20-alpine

WORKDIR /app

# Install dependencies first for optimal layer caching
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy rest of the application files
COPY . .

# Expose Next.js dev server port
EXPOSE 3000

# Next.js development environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "run", "dev"]
