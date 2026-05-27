# VedaAI — AI Assessment Creator

AI-powered assessment generation platform built as a Full Stack Engineering Assignment.

Generate structured question papers from teacher inputs with realtime progress tracking, controlled AI output, and professional paper formatting.

---

# Project Goal

The purpose of this project is not to demonstrate AI text generation.

The purpose is to demonstrate:

- product thinking
- frontend quality
- structured backend architecture
- asynchronous processing
- clean user experience

The application allows a teacher to:

Create Assignment

↓

Generate Questions

↓

Track Progress

↓

Review Output

↓

Export PDF

Instead of returning raw AI responses, the system converts generated content into a structured assessment experience.

---

# Product Philosophy

Most AI applications stop at generation.

This application continues beyond generation.

Input

↓

Processing

↓

Validation

↓

Formatting

↓

Output

↓

Export

The result should feel usable instead of experimental.

---

# Visual Source Of Truth

This project does not use live Figma integration.

UI implementation is based on exported PNG references.

Reference location:

```txt
design/screens/

Supporting Context:

design/references/

Export Metadata:

design/exports/

PNG exports are the implementation reference.
```

The exported screens define:

- layout
- hierarchy
- responsiveness
- interaction direction

Minor responsive adjustments are allowed.

Redesign is intentionally avoided.

---

# Features

## Assignment Creation

Teachers can configure:

- due date
- question types
- number of questions
- total marks
- instructions
- optional upload

Validation prevents invalid submissions.

---

## AI Question Generation

The system converts structured input into:

- sections
- questions
- difficulty
- marks

AI output is never rendered directly.

Pipeline:

Prompt

↓

Generate

↓

Validate

↓

Normalize

↓

Render

---

## Realtime Generation Timeline

Generation progress is visible.

Stages:

Queued

↓

Generating

↓

Structuring

↓

Validating

↓

Completed

This improves trust and perceived speed.

---

## Generated Paper Experience

Output includes:

- student information
- sections
- question list
- marks
- difficulty indicators

The layout is designed to resemble printable assessments.

---

## Section Regeneration

Users can regenerate a single section instead of recreating the entire paper.

Purpose:

preserve work

reduce waiting

improve control

---

## Professional PDF Export

Export includes:

- page structure
- spacing
- printable layout
- student information fields

This avoids browser-print quality issues.

---

# Tech Stack

## Frontend

Next.js

TypeScript

Tailwind CSS

Framer Motion

React Hook Form

Zustand

Socket.io Client

---

## Backend

Node.js

Express

TypeScript

MongoDB

Redis

BullMQ

Socket.io

---

## AI

Gemini 2.5 Flash

---

## Deployment

Frontend:
Vercel

Backend:
Railway

Database:
MongoDB Atlas

Redis:
Upstash

---

# Architecture Overview

Frontend

↓

API Layer

↓

Queue Layer

↓

Worker

↓

AI Generation

↓

Validation

↓

Persistence

↓

Realtime Events

↓

Structured Output

---

# Request Flow

User submits assignment

↓

API validates

↓

Queue creates job

↓

Worker processes

↓

AI generates

↓

Response validated

↓

Output stored

↓

Socket emits progress

↓

Frontend updates

↓

PDF available

---

# Folder Structure

See:

```txt
docs/FOLDER_STRUCTURE.md
```

---

# Documentation

Project documentation is intentionally detailed.

Location:

```txt
docs/
```

Files:

PRD

Architecture

Tasks

Decisions

Rules

Prompts

API Specification

README

Purpose:

keep implementation consistent.

---

# Development Setup

Clone:

```bash
git clone <repo-url>
```

Enter:

```bash
cd veda-ai-assessment
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Environment:

Create:

```txt
.env
```

Required:

```env
MONGODB_URI=

REDIS_URL=

GEMINI_API_KEY=

NEXT_PUBLIC_API=

SOCKET_URL=
```

---

# Build Order

UI Foundation

↓

Screens

↓

State

↓

Backend

↓

AI

↓

Realtime

↓

Output

↓

PDF

↓

Polish

↓

Deploy

---

# Project Constraints

Intentionally excluded:

- authentication
- docker
- notifications
- admin
- dark mode
- analytics dashboard
- payment

Reason:

protect execution quality.

---

# Design Principles

Structure over AI

Feedback over waiting

Quality over quantity

Workflow over chat

Polish over feature count

---

# Success Criteria

Project succeeds when:

UI feels intentional

generation works

output looks professional

flow feels complete

reviewer can understand system quickly

---

# Future Improvements

Authentication

Assignment templates

Collaborative editing

Advanced analytics

Multiple export formats

Custom generation profiles

---

# Credits

Built as a Full Stack Engineering Assignment.

Focused on:

product quality

engineering clarity

real-world execution