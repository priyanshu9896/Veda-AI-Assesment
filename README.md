# VedaAI — AI Assessment Creator

VedaAI is a workflow-driven AI assessment generator for teachers. It allows teachers to configure assignment details, question types, marks, and reference materials, and uses Google's Groq LLaMA 3 70B (Fallback to OpenRouter) to automatically generate a complete, structured question paper that can be downloaded as a PDF.

## Features

- **2-Step Creation Flow**: Configure basic details, question types, and instructions.
- **AI Generation**: Powered by Groq LLaMA 3 70B (Fallback to OpenRouter), returning structured JSON based on exact constraints.
- **Real-Time Generation Timeline**: BullMQ workers + Socket.io broadcast live progress updates to the frontend.
- **Interactive Output**: View generated paper, regenerate individual sections, and download as PDF.
- **Responsive UI**: Fully mobile-responsive interface matching high-fidelity designs.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, React Hook Form, Framer Motion
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Redis (BullMQ), Socket.io, pdf-lib
- **AI Model**: Google Groq LLaMA 3 70B (Fallback to OpenRouter)

## Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or via Atlas)
- Redis (running locally or via Upstash)
- Groq LLaMA 3 70B API Key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp ../.env.example .env
   ```
   *Make sure to fill in your `Groq/OpenRouter_API_KEY`, `MONGODB_URI`, and `REDIS_URL`.*
4. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:4000`.

> **Note**: If you don't have Redis or a Groq/OpenRouter API Key, the backend gracefully degrades into **Mock Mode** and **Inline Generation Mode**, simulating AI responses so you can still test the UI!

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file (optional, defaults are set for local dev):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
   NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000` (or `3001` if 3000 is occupied).

## Deployment Preparation

- **Frontend**: Ready for Vercel. Ensure you add `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to Vercel environment variables.
- **Backend**: Ready for Railway/Render. Set `Groq/OpenRouter_API_KEY`, `MONGODB_URI` (Atlas), and `REDIS_URL` (Upstash) in your hosting provider's secrets manager. Ensure you bind to the correct `PORT`.
