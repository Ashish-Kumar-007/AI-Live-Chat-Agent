# Frontend Development Guide

## Overview

This is a modern Next.js 16 frontend application for the AI Chat platform, built with TypeScript, Tailwind CSS, and Zustand for state management.

## Tech Stack

- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Zustand 5.0.9** - Lightweight state management
- **Axios 1.13.2** - HTTP client
- **Lucide React** - Icon library
- **Radix UI Icons** - Additional icons

## Project Structure

```
client/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   └── auth/
│   │       └── login/           # Login API endpoint
│   ├── chat/                    # Chat page
│   │   └── page.tsx
│   ├── login/                   # Login page
│   │   └── page.tsx
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home (redirects)
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── alert.tsx
│   └── chat/                    # Chat-specific components
│       ├── message-bubble.tsx
│       ├── message-input.tsx
│       ├── conversation-sidebar.tsx
│       └── chat-container.tsx
├── lib/
│   ├── api.ts                   # API client and endpoints
│   └── utils.ts                 # Utility functions
├── store/
│   ├── auth-store.ts            # Authentication state
│   └── chat-store.ts            # Chat state management
└── middleware.ts                # Next.js middleware
```

## Getting Started

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret-here
```

**Important:** `NEXT_PUBLIC_JWT_SECRET` should match the backend's `JWT_SECRET`.

### 3. Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3001` (to avoid conflict with backend on port 3000).

## Features

### Authentication

- **JWT Token Management**: Tokens stored in localStorage
- **Persistent Login**: Zustand persist middleware
- **Auto-redirect**: Unauthenticated users redirected to login
- **Token Refresh**: Automatic token handling

### Chat Interface

- **Real-time Messaging**: Polling-based message updates
- **Conversation Management**: Sidebar with conversation history
- **Message Display**: Beautiful message bubbles with timestamps
- **Loading States**: Visual feedback during operations
- **Error Handling**: User-friendly error messages

### UI/UX

- **Responsive Design**: Works on all screen sizes
- **Dark Mode Ready**: CSS variables for theme switching
- **Smooth Animations**: Fade-in and slide animations
- **Accessible**: Semantic HTML and ARIA labels

## API Integration

### Endpoints Used

1. **POST /chat/message**
   - Send a message
   - Creates new conversation if needed
   - Returns conversation ID and status

2. **GET /chat/conversations**
   - Get all conversations for user
   - Returns array of conversations

3. **GET /chat/conversations/:id/messages**
   - Get messages for a conversation
   - Returns array of messages

### Authentication

All API requests include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## State Management

### Auth Store (`store/auth-store.ts`)

Manages authentication state:
- `token`: JWT token
- `userId`: Current user ID
- `isAuthenticated`: Auth status
- `setAuth()`: Set authentication
- `logout()`: Clear authentication
- `initialize()`: Initialize from localStorage

### Chat Store (`store/chat-store.ts`)

Manages chat state:
- `conversations`: List of conversations
- `currentConversationId`: Active conversation
- `messages`: Messages in current conversation
- `isLoading`: Loading state
- `isSending`: Sending state
- `error`: Error message

## Components

### UI Components

- **Button**: Styled button with variants
- **Input**: Text input field
- **Card**: Container component
- **Alert**: Alert/notification component

### Chat Components

- **MessageBubble**: Individual message display
- **MessageInput**: Message input with send button
- **ConversationSidebar**: Sidebar with conversation list
- **ChatContainer**: Main chat area

## Styling

Uses Tailwind CSS with custom theme:
- CSS variables for colors
- Dark mode support
- Responsive utilities
- Custom animations

## Development

### Adding New Features

1. **New API Endpoint**: Add to `lib/api.ts`
2. **New Component**: Create in `components/`
3. **New Page**: Create in `app/`
4. **New State**: Add to appropriate store

### Best Practices

- Use TypeScript for all files
- Follow Next.js App Router conventions
- Use Zustand for global state
- Keep components small and focused
- Use Tailwind utility classes
- Handle loading and error states

## Production Build

```bash
# Build
npm run build

# Start production server
npm start
```

## Troubleshooting

### CORS Errors
- Ensure backend CORS allows `http://localhost:3001`
- Check `NEXT_PUBLIC_API_URL` is correct

### Authentication Issues
- Verify `NEXT_PUBLIC_JWT_SECRET` matches backend
- Check token format in localStorage
- Clear localStorage and re-login

### API Connection
- Verify backend is running on port 3000
- Check network tab in browser DevTools
- Verify API endpoints are correct

## Next Steps

- [ ] Add WebSocket support for real-time updates
- [ ] Implement message search
- [ ] Add file upload support
- [ ] Implement message reactions
- [ ] Add user profiles
- [ ] Implement dark mode toggle
- [ ] Add message editing/deletion
- [ ] Implement typing indicators

