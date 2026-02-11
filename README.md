# Construction Management System

A full-stack construction management system built with Next.js, Express.js, and MongoDB.

## Features

- Dashboard with KPI overview and project statistics
- Project management with task tracking
- Employee management
- JWT authentication with role-based access
- Responsive design for desktop and mobile
- Animated collapsible sidebar

## Tech Stack

### Frontend
- Next.js
- Tailwind CSS
- Framer Motion
- shadcn/ui components
- Recharts for data visualization

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/construction-management.git
cd construction-management
\`\`\`

2. Install dependencies for both frontend and backend
\`\`\`bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
\`\`\`

3. Set up environment variables
\`\`\`bash
# Copy the example env file and modify it with your settings
cp backend/.env.example backend/.env
\`\`\`

4. Seed the database (optional)
\`\`\`bash
cd backend
npm run seed
cd ..
\`\`\`

5. Run the development servers
\`\`\`bash
# Run both frontend and backend concurrently
npm run dev:full

# Or run them separately
npm run dev        # Frontend
npm run server     # Backend
\`\`\`

6. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Default Login

- Email: admin
- Password: admin

## Project Structure

### Frontend
- `/app`: Next.js app directory with pages and layouts
- `/components`: Reusable React components
- `/lib`: Utility functions and types

### Backend
- `/controllers`: Business logic for API endpoints
- `/models`: Mongoose models for database entities
- `/routes`: API route definitions
- `/middleware`: Authentication and other middleware

## License

This project is licensed under the MIT License.
