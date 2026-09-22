# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project. 

@'
# SkillSwap

> A creator gig marketplace built for the AZIS-FQKGJV hackathon.

## Hackathon

**Hackathon ID:** `AZIS-FQKGJV`

**Track:** Real-World AI Products  
**Challenge:** SkillSwap — Creator Gig Marketplace

## Team

- Prince Chauhan
- Sushant Kumar Ravi

## Overview

SkillSwap is a creator economy marketplace where creators can list their services and clients can discover, book, and track those services.

The product provides a simple marketplace flow with clear booking states and creator-side request management.

## Features

### 1. Post a Gig

Creators can publish a service with:

- Title
- Category
- Rate
- Description

### 2. Browse & Search

Clients can:

- Browse all gigs
- Search by title, category, description, or creator
- Filter gigs by category
- Discover newly posted gigs through newest-first ordering

### 3. Book a Gig

Clients can select a gig and submit:

- Name
- Email
- Requirements

A successful booking starts with `Pending` status and displays a confirmation.

### 4. Creator Dashboard

Creators can view incoming booking requests and:

- Accept pending requests
- Decline pending requests
- View booking statuses
- View booking statistics

### 5. My Bookings

Clients can view their bookings and their current status:

- `Pending`
- `Accepted`
- `Declined`

When a booking is declined, the client can return to the marketplace and browse other gigs.

## Product Decisions

The three required product decisions are documented in [DECISIONS.md](./DECISIONS.md).

They cover:

1. What happens after a creator declines a booking
2. Whether a gig can receive another booking while one is pending
3. How gigs are ranked during discovery

## API

SkillSwap implements a REST-style API using Express.

### Gig Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/gigs` | List all gigs |
| POST | `/api/gigs` | Create a gig |
| GET | `/api/gigs/:id` | Get a single gig |

### Booking Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings/client` | Get client bookings |
| GET | `/api/bookings/creator` | Get creator bookings |
| PATCH | `/api/bookings/:id/accept` | Accept a booking |
| PATCH | `/api/bookings/:id/decline` | Decline a booking |

### Health Check

```text
GET /api/health

