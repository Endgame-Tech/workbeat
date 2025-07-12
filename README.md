# WorkBeat - Modern Employee Attendance Management System

![WorkBeat Logo](https://via.placeholder.com/500x100?text=WorkBeat)

## Overview

WorkBeat is a comprehensive, modern employee attendance management system designed for organizations of all sizes. It features biometric authentication, real-time dashboards, advanced analytics, multi-organization support, and subscription-based features with offline capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v5-3982CE.svg)](https://www.prisma.io/)

## 🌟 Key Features

### 🔐 Advanced Authentication & Security

- **Multi-Modal Biometric Authentication**
  - Facial recognition with confidence scoring
  - Fingerprint authentication (WebAuthn)
  - Location-based verification with geofencing
  - Device fingerprinting and session management
  - Two-factor authentication support

### 📊 Real-Time Analytics & Dashboards

- **Comprehensive Analytics**
  - Live attendance statistics with WebSocket updates
  - Department-wise performance metrics
  - Predictive analytics and trend analysis
  - Executive summary reports with insights
  - Operational intelligence dashboards

### 🏢 Multi-Organization Architecture

- **Enterprise-Ready**
  - Complete organization isolation
  - Role-based access control (Admin/Manager/Employee)
  - Subscription-based feature gating
  - Custom branding and theming per organization
  - Advanced security settings

### 📱 Progressive Web App (PWA)

- **Modern User Experience**
  - Offline-first architecture with data synchronization
  - Push notifications for real-time updates
  - Installable on mobile and desktop
  - Dark/light theme support
  - Responsive design for all devices

### 💼 Advanced Workforce Management

- **Complete HR Features**
  - Employee lifecycle management
  - Leave management system with approval workflows
  - Shift scheduling and template management
  - Department and hierarchy management
  - Performance tracking and reporting

### 🔄 Real-Time Features

- **Live Updates**
  - WebSocket-powered real-time attendance updates
  - Live dashboard statistics
  - Instant notifications and alerts
  - Online user presence indicators
  - Auto-refresh capabilities

### 📈 Export & Reporting

- **Comprehensive Reporting**
  - Advanced Excel/CSV/PDF export capabilities
  - Customizable report templates
  - Executive summary generation
  - Attendance pattern analysis
  - Cost impact calculations

## 📋 Prerequisites

- **Node.js** (v18 or later)
- **PostgreSQL** (v13 or later) - Primary database
- **SQLite** (for development/testing)
- **Git**
- **Modern web browser** with camera support
- **SSL Certificate** (for production HTTPS)

## 🗄️ Database Support

WorkBeat supports multiple database configurations:

- **PostgreSQL** (Recommended for production)
- **SQLite** (Development and testing)
- **SQL Server** (Enterprise deployments)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/workbeat.git
cd workbeat
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

#### Environment Configuration (.env)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (PostgreSQL - Recommended)
DATABASE_URL="postgresql://username:password@localhost:5432/workbeat"

# For SQLite (Development only)
# DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET=your_super_secure_random_string_here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=another_super_secure_random_string
REFRESH_TOKEN_EXPIRE=30d

# Biometric Settings
FACE_RECOGNITION_CONFIDENCE_THRESHOLD=0.8
FINGERPRINT_ENABLED=true

# File Upload Settings
MAX_FILE_SIZE=10MB
UPLOAD_DIR=uploads

# WebSocket Configuration
WEBSOCKET_ENABLED=true
WEBSOCKET_CORS_ORIGIN=http://localhost:5173

# Paystack Integration (for subscriptions)
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security Settings
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# PWA Settings
PWA_ENABLED=true
```

#### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# For PostgreSQL setup
npm run setup:postgresql

# Apply database migrations
npx prisma migrate deploy

# Seed the database with sample data
npm run seed
```

### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

#### Client Environment Configuration (.env)

```bash
# API Configuration
VITE_APP_API_URL=http://localhost:5000

# WebSocket Configuration
VITE_WEBSOCKET_URL=ws://localhost:5000

# PWA Settings
VITE_PWA_ENABLED=true

# Development Settings
VITE_ENABLE_DEVTOOLS=true

# Biometric Settings
VITE_FACE_RECOGNITION_ENABLED=true
VITE_FINGERPRINT_ENABLED=true

# Paystack Configuration (Frontend)
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Environment
VITE_NODE_ENV=development
```

## 🚀 Running the Application

### Development Mode

1. **Start the backend server**

   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend development server**

   ```bash
   cd client
   npm run dev
   ```

3. **Access the application**

   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Database Studio: `http://localhost:5555` (run `npx prisma studio`)

### Production Deployment

#### Option 1: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# The application will be available at http://localhost:3000
```

#### Option 2: Manual Production Build

```bash
# Build the client
cd client
npm run build

# Start the production server
cd ../server
npm run build
npm start
```

#### Option 3: Cloud Deployment

- **Vercel/Netlify**: Frontend deployment
- **Railway/Render**: Full-stack deployment
- **Heroku**: Complete application deployment

See deployment guides:

- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Render Deployment Guide](./RENDER_DEPLOYMENT.md)
- [Production Readiness Checklist](./PRODUCTION_READINESS_AUDIT.md)

## 🎯 Default Access

After successful installation and seeding:

### Super Admin Access

```sh
Email: admin@workbeat.com
Password: admin123
```

### Organization Admin

```sh
Email: org-admin@company.com
Password: admin123
```

### Employee Access

```sh
Email: employee@company.com
Password: employee123
```

**⚠️ Important**: Change these passwords immediately in production!

## 🔄 API Documentation

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | No |
| `/api/auth/login` | POST | User login | No |
| `/api/auth/refresh` | POST | Refresh JWT token | Yes |
| `/api/auth/logout` | POST | User logout | Yes |
| `/api/auth/forgot-password` | POST | Password reset | No |

### Organization Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/organizations` | GET | Get organizations | Yes (Admin) |
| `/api/organizations/:id` | GET | Get organization details | Yes |
| `/api/organizations/:id/settings` | PUT | Update settings | Yes (Admin) |
| `/api/organizations/:id/employees` | GET | Get organization employees | Yes |

### Attendance & Biometrics

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/attendance` | POST | Record attendance | No |
| `/api/attendance/biometric` | POST | Biometric attendance | No |
| `/api/attendance/face-recognition` | POST | Face recognition check-in | No |
| `/api/attendance/fingerprint` | POST | Fingerprint check-in | No |
| `/api/attendance/stats` | GET | Attendance statistics | Yes |

### Advanced Features

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/leave-requests` | GET/POST | Leave management | Yes |
| `/api/shift-templates` | GET/POST | Shift scheduling | Yes (Admin) |
| `/api/analytics/dashboard` | GET | Dashboard analytics | Yes |
| `/api/reports/export` | POST | Export reports | Yes |
| `/api/subscriptions` | GET/POST | Subscription management | Yes (Admin) |

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## 🛠️ Technology Stack

### Frontend Architecture

```li
React 18 + TypeScript
├── Vite (Build tool)
├── Tailwind CSS (Styling)
├── React Router v6 (Navigation)
├── React Query (State management)
├── Socket.io Client (Real-time)
├── Workbox (PWA/Service Worker)
├── React Hook Form (Forms)
└── Recharts (Data visualization)
```

### Backend Architecture

```li
Node.js + Express + TypeScript
├── Prisma ORM (Database)
├── PostgreSQL/SQLite (Database)
├── Socket.io (WebSocket)
├── JWT + Refresh Tokens (Auth)
├── WebAuthn (Biometrics)
├── Paystack (Payments)
├── Nodemailer (Email)
└── Winston (Logging)
```

### Infrastructure & DevOps

```li
Production Stack
├── Docker + Docker Compose
├── Nginx (Reverse proxy)
├── PM2 (Process management)
├── PostgreSQL (Production DB)
├── Redis (Caching/Sessions)
└── SSL/TLS (Security)
```

## 📱 Progressive Web App Features

### PWA Capabilities

- **Offline Functionality**: Full offline attendance recording with sync
- **Push Notifications**: Real-time updates even when app is closed
- **Install Prompts**: Install on mobile/desktop like native app
- **Background Sync**: Automatic data synchronization
- **App Shell**: Fast loading with cached resources

### Service Worker Features

- Offline attendance recording
- Background data synchronization
- Push notification handling
- Cache management
- Network-first/Cache-first strategies

## 🔒 Security Features

### Authentication & Authorization

- JWT with refresh token rotation
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Session management with device tracking
- Password policies and account lockout

### Data Protection

- End-to-end encryption for sensitive data
- Biometric data encryption
- GDPR compliance features
- Audit logging
- Data retention policies

### Infrastructure Security

- CORS protection
- Rate limiting
- CSRF protection
- XSS prevention
- SQL injection protection

## 🎨 Customization & Branding

### Theme Customization

```typescript
// Custom theme configuration
interface BrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  darkModeEnabled?: boolean;
  customBranding?: boolean;
  companyName?: string;
}
```

### Organization Settings

- Custom logos and colors
- Attendance policies configuration
- Working hours and shifts
- Geofencing settings
- Notification preferences

## 📊 Analytics & Reporting

### Available Reports

- **Daily Attendance Reports**: Real-time daily summaries
- **Employee Performance**: Individual performance tracking
- **Department Analytics**: Department-wise insights
- **Late Arrival Analysis**: Punctuality tracking
- **Executive Summaries**: High-level business insights
- **Cost Impact Analysis**: Financial impact calculations

### Export Formats

- **Excel (.xlsx)**: Advanced spreadsheets with charts
- **CSV**: Raw data for external analysis
- **PDF**: Professional formatted reports
- **JSON**: API-friendly data export

## 🔧 Development

### Code Quality

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Check code coverage
npm run test:coverage
```

### Database Management

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Deploy migrations
npx prisma migrate deploy
```

### Development Tools

- **Prisma Studio**: Database GUI
- **React DevTools**: Component debugging
- **Redux DevTools**: State management debugging
- **WebSocket Testing**: Real-time feature testing

## 🚀 Deployment Options

### Cloud Platforms

1. **Vercel** (Frontend) + **Railway** (Backend)
2. **Netlify** (Frontend) + **Render** (Backend)
3. **Heroku** (Full-stack)
4. **AWS** (Production-scale)
5. **DigitalOcean** (VPS deployment)

### Self-Hosted

1. **Docker Deployment**: Complete containerized solution
2. **Traditional VPS**: Ubuntu/CentOS server setup
3. **Kubernetes**: Enterprise-scale orchestration

## 🔍 Troubleshooting

### Common Issues

## Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
npx prisma db push
```

## WebSocket Connection Problems

```bash
# Check server logs
npm run logs

# Verify CORS settings
# Check firewall rules
```

## PWA Installation Issues

```bash
# Verify HTTPS setup
# Check service worker registration
# Validate manifest.json
```

## Biometric Features Not Working

```bash
# Check camera permissions
# Verify HTTPS (required for WebAuthn)
# Test browser compatibility
```

### Performance Optimization

- Enable database connection pooling
- Implement Redis caching
- Optimize image compression
- Use CDN for static assets
- Enable gzip compression

## 📖 Additional Documentation

- [Installation Guide](./INSTALLATION_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_CHECKLIST.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [PWA Features](./PWA_IMPLEMENTATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper tests
4. Run quality checks (`npm run lint && npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [React](https://reactjs.org/) - Frontend library
- [Node.js](https://nodejs.org/) - Backend runtime
- [Prisma](https://www.prisma.io/) - Database ORM
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Socket.io](https://socket.io/) - Real-time communication
- [WebAuthn](https://webauthn.io/) - Biometric authentication

## 📞 Support & Contact

- **Email**: [legendetestimony@gmail.com](mailto:legendetestimony@gmail.com)
- **Backup Email**: [endgamehq@gmail.com](mailto:endgamehq@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/workbeat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/workbeat/discussions)

## 🎯 Roadmap

### Upcoming Features

- [ ] Mobile native app (React Native)
- [ ] Advanced ML-based attendance prediction
- [ ] Integration with popular HR systems
- [ ] Multi-language support
- [ ] Advanced audit trails
- [ ] API rate limiting dashboard
- [ ] Custom webhook support

---

**WorkBeat** - Revolutionizing workforce management with modern technology.

### Built with ❤️ by Legend Testimony from Endgame
