# AI Chat Frontend

Modern Next.js frontend for the AI Chat application powered by Cerebras AI.

## Features

- 🚀 **Next.js 16** with App Router
- ⚡ **Real-time Chat Interface** with message polling
- 🎨 **Modern UI** with Tailwind CSS
- 🔐 **JWT Authentication** with Zustand state management
- 💬 **Conversation Management** with sidebar
- 📱 **Fully Responsive** design
- 🎯 **TypeScript** for type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- Backend server running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Update .env.local with your configuration
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret-here
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
client/
├── app/                    # Next.js App Router
│   ├── chat/              # Chat page
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects)
├── components/
│   ├── ui/                # Reusable UI components
│   └── chat/              # Chat-specific components
├── lib/                   # Utilities and API client
├── store/                 # Zustand state management
└── public/                # Static assets
```

## Features

### Authentication
- JWT token-based authentication
- Persistent login state
- Automatic token refresh handling

### Chat Interface
- Real-time message display
- Auto-scrolling to latest message
- Loading states and error handling
- Message polling for assistant responses

### Conversation Management
- Sidebar with conversation history
- Create new conversations
- Switch between conversations
- View conversation timestamps

## API Integration

The frontend communicates with the backend API:

- `POST /chat/message` - Send a message
- `GET /chat/conversations` - Get conversation history
- `GET /chat/conversations/:id/messages` - Get messages for a conversation

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Radix UI** - Accessible component primitives

## Development Notes

- The app uses client-side JWT generation for demo purposes
- In production, implement proper login endpoint
- Message polling happens every 2 seconds until response is received
- Rate limiting is handled gracefully with user feedback

## Troubleshooting

### CORS Issues
Ensure the backend has CORS enabled for `http://localhost:3001`

### Authentication Errors
Check that `NEXT_PUBLIC_JWT_SECRET` matches the backend `JWT_SECRET`

### API Connection
Verify `NEXT_PUBLIC_API_URL` points to the correct backend URL
