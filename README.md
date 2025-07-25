# Productivity Hub

A personal productivity assistant to help you track tasks, manage projects, schedule work, and integrate with your favorite tools.

> [!NOTE]
> **v0.12.0 Highlights:**
> - Major UI/UX overhaul
> - Notification system
> - Accessibility improvements
> - Project management UI
> See the [CHANGELOG](./CHANGELOG.md) for full details.

<details>
<summary>📋 <strong>Tech Stack Table</strong></summary>

| Layer      | Technology                | Notes                       |
|------------|---------------------------|-----------------------------|
| Frontend   | React (TypeScript)        | UI, routing, state          |
| Styling    | Tailwind CSS              | Utility-first CSS           |
| Backend    | Python (Flask)            | REST API, business logic    |
| Database   | SQLite                    | Easy setup, can migrate     |
| Auth       | Flask-Login, Flask-Dance  | Basic & social login        |

</details>

## Quick Links
- [Roadmap](./ROADMAP.md) — Development checklist & future plans
- [Features](./FEATURES.md) — Full feature list
- [API Reference](./docs/API.md) — All endpoints & authentication
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture](./docs/architecture.md)
- [Error Handling](./docs/error-handling-system.md)
- [Changelog](./CHANGELOG.md)
- [License](./LICENSE)
- [Contributing](./CONTRIBUTING.md)

## Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.9+ (for backend)

### Setup
1. **Clone the repository**
2. **Install and run the frontend:**
   ```sh
   cd frontend
   npm install
   npm run dev
   ```
3. **Set up and run the backend:**
   - Linux/macOS:
     ```sh
     cd backend
     python -m venv venv
     source venv/bin/activate
     pip install -r requirements.txt
     python app.py
     ```
   - Windows:
     ```sh
     cd backend
     python -m venv venv
     venv\Scripts\activate
     pip install -r requirements.txt
     python app.py
     ```

## Roadmap
See [ROADMAP.md](./ROADMAP.md) for a step-by-step development checklist.

> [!TIP]
> **🚀 Upcoming Features**
> - 🗂️ List view and Kanban view for tasks
> - 🔗 Expanded integrations (Google Drive, Alexa, Discord)
> - 📅 Advanced scheduling and analytics
> - 🧩 Custom dashboard widgets

## License
See [LICENSE](./LICENSE) for license details.
