# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies

```bash
cd client
npm install
```

### Step 2: Configure Environment

Create `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important:** The `NEXT_PUBLIC_JWT_SECRET` must match the backend's `JWT_SECRET` in `server/.env`.

### Step 3: Start the Application

```bash
# Make sure backend is running first
cd ../server
npm run dev

# In another terminal, start frontend
cd client
npm run dev
```

The frontend will be available at: **http://localhost:3001**

## 📋 Prerequisites

1. **Backend Server Running**
   - PostgreSQL running
   - Redis running
   - Backend API on port 3000

2. **Node.js 18+** installed

## 🎯 First Use

1. Open http://localhost:3001
2. You'll be redirected to login
3. Enter any User ID (e.g., "user-123")
4. Click "Login"
5. Start chatting!

## 🛠️ Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

- `app/` - Next.js pages and routes
- `components/` - React components
- `lib/` - Utilities and API client
- `store/` - Zustand state management

## 🔧 Troubleshooting

### Port Already in Use
Change port in `package.json`:
```json
"dev": "next dev -p 3002"
```

### CORS Errors
Ensure backend CORS allows `http://localhost:3001`

### Authentication Fails
Check that `NEXT_PUBLIC_JWT_SECRET` matches backend `JWT_SECRET`

## 📚 Documentation

- See `Frontend_Guide.md` for detailed documentation
- See `README.md` for project overview

