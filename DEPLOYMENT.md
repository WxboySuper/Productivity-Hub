# Deployment Guide

This guide will help you deploy Productivity Hub to your Hostinger VPS.

## Prerequisites
- Hostinger VPS with SSH access
- Python 3.9+
- Node.js (for frontend build)
- Git

## Steps
1. SSH into your VPS
2. Clone the repository
3. Set up Python virtual environment and install backend dependencies
4. Set up Node.js and install frontend dependencies
5. Build the frontend and serve static files (or use a reverse proxy)
6. Set up environment variables and production configs
7. Use a process manager (e.g., Gunicorn, PM2) to run the backend
8. Set up a web server (e.g., Nginx) to serve the app
9. Configure your domain and HTTPS

## Updating the App
- Pull latest changes from Git
- Rebuild frontend and restart backend

*Expand this guide as your deployment process evolves!*
