# Architecture Overview

This document provides a high-level overview of the Productivity Hub architecture. As the project grows, update this file with diagrams, explanations, and integration details.

## Structure

- **Frontend** (`/frontend`):
  - Built with React (TypeScript) and Tailwind CSS
  - Handles all user interface, routing, and API requests

- **Backend** (`/backend`):
  - Built with Python (Flask)
  - Provides REST API endpoints for all app features
  - Handles authentication, business logic, and database operations

- **Database**:
  - SQLite (development/personal use)
  - Can migrate to PostgreSQL for production/multi-user

- **Integrations**:
  - Google Drive/Docs (highest priority)
  - Alexa (next priority)
  - Discord (planned)

## Data Flow
1. User interacts with the frontend (React UI)
2. Frontend sends API requests to the backend (Flask)
3. Backend processes requests, interacts with the database, and returns responses
4. Integrations are handled by the backend, with results/data sent to the frontend as needed

## Deployment
- Both frontend and backend are deployed on your Hostinger VPS
- Nginx (or similar) can be used as a reverse proxy
- See DEPLOYMENT.md for details

## Diagrams
- Add diagrams here as your architecture evolves (e.g., sequence diagrams, ER diagrams, integration flows)

---

*Expand this document as your project grows!*
