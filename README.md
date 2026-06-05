# Inventory & Order Management System

A production-ready, containerized, full-stack application built using:
- **Backend:** Python FastAPI + SQLAlchemy
- **Database:** PostgreSQL
- **Frontend:** React (Vite) + Tailwind CSS v3
- **Containerization:** Docker & Docker Compose

---

## Project Structure

```text
inventory_order_system/
├── backend/            # FastAPI python source code, models, requirements, Dockerfile
├── frontend/           # React + Tailwind CSS source code, pages, configs, Dockerfile
├── docker-compose.yml  # Orchestrates PostgreSQL, backend API, and Nginx frontend services
├── .env                # Local database and port credentials
└── README.md           # Getting started and setup guide
```

---

## Local Setup

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Running with Docker Compose
1. Clone this repository and navigate to the directory:
   ```bash
   cd inventory_order_system
   ```
2. Copy the example env configuration:
   ```bash
   cp .env.example .env
   ```
3. Start the entire container stack in detached mode:
   ```bash
   docker-compose up --build -d
   ```


---

## Cloud Deployment Guide

*(Please insert your preferred hosting platforms, e.g. Vercel for Frontend, Render for Backend and PostgreSQL)*
