# Street Credit

A social media and streaming platform built on the Solana blockchain, using Street Credit as the social "currency".

## Features

- Phantom Wallet Integration
- Real-time synchronized radio station
- Blog platform with social interactions
- Event ticketing system
- User roles (Tastemaker, DJ, Artist)
- Street Credit economy
- Responsive design for mobile and desktop

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Express.js, Node.js
- Database: MySQL with Prisma
- Cache: Memcached
- Search: Elasticsearch
- Blockchain: Solana
- Containerization: Docker
- Reverse Proxy: Nginx

## Prerequisites

- Node.js 20.x
- Docker and Docker Compose
- Phantom Wallet browser extension
- MySQL 8.0 (if running locally)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/street-credit.git
cd street-credit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development environment:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Development

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Elasticsearch: `http://localhost:9200`
- MySQL: `localhost:3306`

## Production Deployment

1. Build the Docker images:
```bash
docker-compose build
```

2. Start the production environment:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 