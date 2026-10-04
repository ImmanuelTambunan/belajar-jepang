FROM node:20-alpine

WORKDIR /app

# Salin package manifest
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin source code
COPY . .

# Expose port Vite dev server
EXPOSE 5173

# Jalankan server pengembangan Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
