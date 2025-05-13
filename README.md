# workbeat# WorkBeat - Employee Attendance Management System

![WorkBeat Logo](https://via.placeholder.com/500x100?text=WorkBeat)

## Overview

WorkBeat is a modern, comprehensive employee attendance management system designed to simplify workforce tracking. It features facial recognition sign-in/sign-out, detailed attendance reports, employee management, and an intuitive admin dashboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v4-3982CE.svg)](https://www.prisma.io/)

## 🌟 Features

- **Biometric Authentication**
  - Facial recognition sign-in/sign-out
  - Photo verification of attendance
  - Location tracking for verification

- **Comprehensive Dashboard**
  - Real-time attendance statistics
  - Departmental analytics
  - Lateness and absence tracking

- **Employee Management**
  - Complete employee profiles
  - Department organization
  - Active/inactive status management

- **Reporting & Analytics**
  - Customizable date range reports
  - Exportable attendance data
  - Visual attendance trends

- **Multi-Organization Support**
  - Separate organizational accounts
  - Role-based access controls
  - Admin/manager/employee permission levels

## 📋 Prerequisites

- Node.js (v16 or later)
- NPM or Yarn package manager
- Git
- Web camera (for facial recognition features)

## 🔧 Installation

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/workbeat.git
   cd workbeat
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the server directory:
   ```
   PORT=5000
   JWT_SECRET=your_random_secret_here
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```
   
   For production, use stronger secrets and appropriate settings:
   ```
   PORT=5000
   JWT_SECRET=long_randomly_generated_string
   JWT_EXPIRE=7d
   NODE_ENV=production
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Apply migrations
   npx prisma migrate deploy
   ```

5. **Seed the database (optional)**
   ```bash
   node seeder.js -i
   ```

6. **Create uploads directories**
   ```bash
   mkdir -p uploads/faces
   ```

### Frontend Setup

1. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file in the client directory:
   ```
   VITE_APP_API_URL=http://localhost:5000
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the client**
   ```bash
   cd client
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Production Mode

1. **Build the client**
   ```bash
   cd client
   npm run dev
   ```

2. **Start the server**
   ```bash
   cd /server
   npm run dev
   ```

3. **Access the application**
   - Application will be available at http://localhost:5000


**Important**: Change these passwords after the first login in a production environment.

## 🗄️ Database Management

WorkBeat uses SQLite with Prisma ORM for data management.

1. **View database with Prisma Studio**
   ```bash
   cd server
   npx prisma studio
   ```

2. **Database backup**
   ```bash
   # Create a backup
   cp server/prisma/dev.db server/prisma/backup_$(date +%Y%m%d).db
   
   # Restore from backup
   cp server/prisma/backup_YYYYMMDD.db server/prisma/dev.db
   ```

3. **Reset database**
   ```bash
   cd server
   npx prisma migrate reset
   ```

## 🔄 API Endpoints

| Endpoint                      | Method | Description                           | Auth Required |
|-------------------------------|--------|---------------------------------------|--------------|
| `/api/auth/register`          | POST   | Register a new user                   | Yes (Admin)  |
| `/api/auth/login`             | POST   | User login                            | No           |
| `/api/auth/me`                | GET    | Get current user                      | Yes          |
| `/api/employees`              | GET    | Get all employees                     | Yes          |
| `/api/employees/:id`          | GET    | Get single employee                   | Yes          |
| `/api/employees`              | POST   | Create employee                       | Yes (Admin)  |
| `/api/employees/:id`          | PUT    | Update employee                       | Yes (Admin)  |
| `/api/employees/:id`          | DELETE | Delete employee                       | Yes (Admin)  |
| `/api/attendance`             | GET    | Get all attendance records            | Yes          |
| `/api/attendance`             | POST   | Create attendance record              | No           |
| `/api/attendance/face`        | POST   | Record attendance with face           | No           |
| `/api/attendance/stats/today` | GET    | Get today's attendance statistics     | Yes          |
| `/api/attendance/report`      | GET    | Generate attendance report            | Yes (Admin)  |
| `/api/organizations/register` | POST   | Register a new organization           | No           |

For a complete API reference, see the [API Documentation](./API_DOCS.md).


## 🔧 Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check if the database file exists at `server/prisma/dev.db`
   - Ensure Prisma migrations have been applied
   - Try resetting the database with `npx prisma migrate reset`

2. **JWT errors**
   - Verify your JWT_SECRET in the .env file
   - Check if token expiration is set properly

3. **Face recognition not working**
   - Ensure camera permissions are granted in the browser
   - Check if the `uploads/faces` directory exists and has write permissions
   - Verify that the client can reach the server API

4. **"Cannot find module" errors**
   - Run `npm install` in both server and client directories
   - Check if all dependencies are installed correctly

### Database Reset

If you need to reset the database completely:

```bash
cd server
rm prisma/dev.db
npx prisma migrate deploy
node seeder.js -i
```

## 🔒 Security Considerations

1. **Production Deployment**
   - Use HTTPS with a valid SSL certificate
   - Change default admin passwords
   - Set strong JWT secrets
   - Consider implementing rate limiting

2. **Data Protection**
   - Regularly backup the database
   - Implement proper access controls
   - Consider data encryption for sensitive information

3. **Authentication Security**
   - Enforce strong password policies
   - Implement account lockout after failed attempts
   - Use refresh tokens for enhanced security

## 🧩 System Architecture

WorkBeat uses a modern tech stack:

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT
- **Biometrics**: Browser-based face recognition

## 📚 Project Structure

```
workbeat/
├── client/               # React frontend
│   ├── public/           # Static assets
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service functions
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   └── package.json      # Client dependencies
├── server/               # Node.js backend
│   ├── config/           # Server configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models (deprecated, using Prisma)
│   ├── prisma/           # Prisma schema and migrations
│   │   ├── migrations/   # Database migrations
│   │   └── schema.prisma # Prisma schema
│   ├── routes/           # API routes
│   ├── uploads/          # Uploaded files
│   │   └── faces/        # Face images
│   ├── utils/            # Utility functions
│   └── package.json      # Server dependencies
└── README.md             # Project documentation
```

## 🛠️ Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hot Toast
- Lucide React (Icons)

### Backend
- Node.js
- Express
- Prisma ORM
- JSON Web Tokens (JWT)
- BCrypt
- SQLite

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [React](https://reactjs.org/) - Frontend library
- [Node.js](https://nodejs.org/) - Backend runtime
- [Prisma](https://www.prisma.io/) - Database ORM
- [Express](https://expressjs.com/) - Web framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vite](https://vitejs.dev/) - Frontend build tool

## 📞 Contact

For questions or support, please contact [legendetestimony@gmail.com](mailto:legendetestimony@gmail.com) [endgamehq@gmail.com](mailto:endgamehq@gmail.com)

---

Code by Legend Testimony from Endgame