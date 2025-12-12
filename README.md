# Amrutam Telemedicine Backend

A production-grade telemedicine backend system built with Node.js, Express, PostgreSQL, and Prisma. Designed to handle ~100k daily consultations with comprehensive features including authentication with MFA, appointment booking, consultation management, prescriptions, payments, and analytics.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Email-based MFA (mandatory for admins)
  - Email verification and password reset flows
  - Role-based access control (PATIENT, DOCTOR, ADMIN, SUPPORT)

- **Doctor Management**
  - Doctor registration and approval workflow
  - Advanced search and filtering (specialization, language, fee, rating)
  - Availability slot management

- **Consultation System**
  - Concurrency-safe booking with database transactions
  - Idempotent requests to prevent double-booking
  - Consultation lifecycle management (REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED)
  - Cancellation with business rules

- **Prescriptions & Payments**
  - Digital prescription creation and retrieval
  - Stub payment integration with webhook support
  - Audit logging for sensitive operations

- **Analytics & Monitoring**
  - Admin dashboard with key metrics
  - Doctor utilization and conversion rates
  - Prometheus-compatible metrics endpoint
  - Structured JSON logging with correlation IDs

- **Background Jobs**
  - Automated consultation reminders
  - In-memory job queue with retry logic

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Authentication**: JWT
- **Logging**: Pino
- **Validation**: Zod
- **Testing**: Jest
- **Containerization**: Docker

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 15
- npm >= 9.0.0

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd amrutam-telemedicine-backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Start PostgreSQL (using Docker)
docker-compose up -d postgres

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Sample Credentials

After running the seed script:

- **Admin**: `admin@amrutam.health` / `Admin@123456`
- **Doctor**: `doctor@amrutam.health` / `Doctor@123456`
- **Patient**: `patient@amrutam.health` / `Patient@123456`

## API Documentation

Base URL: `http://localhost:3000/api/v1`

### Key Endpoints

- **Auth**: `/auth/signup`, `/auth/login`, `/auth/enable-mfa`
- **Users**: `/users/me`, `/users` (admin)
- **Doctors**: `/doctors`, `/doctors/:id/approve` (admin)
- **Availability**: `/availability`, `/availability/doctor/:doctorId`
- **Consultations**: `/consultations`, `/consultations/:id/cancel`
- **Prescriptions**: `/prescriptions`, `/prescriptions/consultation/:id`
- **Payments**: `/payments/initiate`, `/payments/webhook`
- **Analytics**: `/admin/analytics/summary` (admin)
- **Audit**: `/audit-logs` (admin)

See [`docs/openapi.yaml`](./docs/openapi.yaml) for complete API specification.

## Available Scripts

```bash
npm run dev          # Start development server with watch mode
npm start            # Start production server
npm run build        # Build for production
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Project Structure

```
├── src/
│   ├── config/           # Configuration (env, logger, database)
│   ├── middlewares/      # Express middleware
│   ├── modules/          # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── doctors/
│   │   ├── availability/
│   │   ├── consultations/
│   │   ├── prescriptions/
│   │   ├── payments/
│   │   ├── analytics/
│   │   └── audit/
│   ├── utils/            # Utility functions
│   ├── jobs/             # Background jobs
│   ├── app.js            # Express app setup
│   └── server.js         # Server bootstrap
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Database seeder
├── tests/                # Test files
├── docs/                 # Documentation
├── infra/                # Infrastructure (Docker, etc.)
└── .github/workflows/    # CI/CD pipelines
```

## Architecture Highlights

- **Modular Monolith**: Clean separation of concerns with feature-based modules
- **Layered Architecture**: Controllers → Services → Repositories → Database
- **Concurrency Safety**: Database transactions and row-level locking for bookings
- **Idempotency**: Prevents duplicate requests using `Idempotency-Key` header
- **Observability**: Structured logging, metrics, and correlation IDs
- **Security**: Helmet, CORS, rate limiting, MFA, RBAC

See [`docs/architecture.md`](./docs/architecture.md) for detailed architecture documentation.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test tests/unit/crypto.test.js
```

## Security

- All passwords hashed with bcrypt (12 rounds)
- JWT tokens with short expiration (15 minutes)
- MFA mandatory for admin accounts
- Rate limiting on authentication endpoints
- Audit logging for sensitive operations
- Input validation with Zod schemas

See [`docs/security_and_threat_model.md`](./docs/security_and_threat_model.md) for complete security documentation.

## Performance

- Designed for ~100k daily consultations
- p95 latency < 200ms for read APIs
- p95 latency < 500ms for write APIs
- Database connection pooling
- Indexed queries for fast lookups

## Monitoring

- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics` (Prometheus format)
- **Logs**: Structured JSON logs with correlation IDs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue or contact the development team at dev@amrutam.health.
