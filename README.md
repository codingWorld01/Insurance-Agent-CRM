# Insurance CRM 

A modern, single-user Customer Relationship Management system designed specifically for insurance agents. Built with Next.js, Express.js, and PostgreSQL.

## 🚀 Features

- **Dashboard**: Overview of leads, clients, policies, and commission tracking
- **Lead Management**: Track prospects through the sales funnel
- **Client Management**: Manage existing clients and their policies
- **Activity Logging**: Automatic tracking of all CRM activities
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Secure Authentication**: JWT-based authentication system

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for styling
- **ShadCN UI** for component library
- **Recharts** for data visualization
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd insurance-crm-mvp
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE insurance_crm;
```

2. Note your database connection details for the next step.

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/insurance_crm"
# JWT_SECRET="your-secure-jwt-secret"

# Generate Prisma client and setup database
npm run db:setup

# Start the backend server
npm run dev
```

The backend will be running at `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start the frontend development server
npm run dev
```

The frontend will be running at `http://localhost:3000`

### 5. Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Use the default credentials:
   - **Email**: `agent@insurancecrm.com`
   - **Password**: `admin123`

## 🔧 Development

### Backend Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database with sample data
npm run db:reset      # Reset database (WARNING: Deletes all data)
npm run db:setup      # Complete database setup

# Testing
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
```

### Frontend Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Testing
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:e2e      # Run end-to-end tests
npm run test:e2e:ui   # Run E2E tests with UI
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Manual Docker Build

```bash
# Build backend
cd backend
docker build -t insurance-crm-backend .

# Build frontend
cd frontend
docker build -t insurance-crm-frontend .
```

## 🌍 Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `LOG_LEVEL` | Logging level | `info` |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Insurance CRM` |
| `NEXT_PUBLIC_ENABLE_DEBUG` | Enable debug mode | `true` |

## 📊 Database Schema

The application uses the following main entities:

- **Settings**: Application configuration and authentication
- **Lead**: Prospect management with status tracking
- **Client**: Customer information and relationships
- **Policy**: Insurance policy details and commissions
- **Activity**: Audit log of all system activities

## 🧪 Testing

### Unit Tests
```bash
# Frontend unit tests
cd frontend && npm test

# Backend unit tests
cd backend && npm test
```

### Integration Tests
```bash
# Backend API tests
cd backend && npm run test:integration
```

### End-to-End Tests
```bash
# Full user journey tests
cd frontend && npm run test:e2e
```

## 🚀 Production Deployment

### Environment Setup

1. Copy production environment files:
```bash
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
```

2. Update production environment variables with your actual values.

### Build Process

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Database Migration

```bash
cd backend
npx prisma migrate deploy
```

## 🔒 Security Considerations

- Change default JWT secret in production
- Use strong database passwords
- Enable HTTPS in production
- Configure proper CORS origins
- Regular security updates for dependencies
- Implement rate limiting for API endpoints

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/chart-data` - Chart data for leads
- `GET /api/dashboard/activities` - Recent activities

### Leads
- `GET /api/leads` - List leads with search/filter
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/convert` - Convert lead to client

### Clients
- `GET /api/clients` - List clients with search
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get client details with policies
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

**Port Already in Use**
- Change PORT in backend `.env`
- Kill existing processes: `lsof -ti:5000 | xargs kill -9`

**Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`

**Authentication Issues**
- Verify JWT_SECRET is set
- Check token expiration settings
- Clear browser localStorage

### Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Ensure all environment variables are properly set
4. Verify database connectivity and schema

## 📞 Support

For support and questions, please open an issue in the repository.
