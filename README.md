# 🤖 Smart Support Ticketing System — API Server

---

## 🚀 Key Features

*   **Secure Authentication & RBAC**: JWT-based authentication with role-based access control (Admin, Support Agent, Customer).
*   **AI Support Assist (Google Gemini)**:
    *   Automatic category suggestion for new tickets.
    *   Intelligent priority assignment based on ticket descriptions.
    *   Customer sentiment analysis (e.g. Frustrated, Neutral, Happy).
    *   AI-suggested replies for support agents.
*   **Real-time Synced Updates**: Real-time event broadcasting using **Socket.IO** (WebSockets) for ticket status, assignment, and comment updates.
*   **Activity Tracking (Audit Trail)**: Deep history logs documenting every status change, assignment update, and comment.
*   **Email Notifications**: Immediate updates sent via email (powered by SMTP/Nodemailer/Resend) when tickets are created, assigned, or updated.
*   **Fastify Powered & Rate Limited**: Designed using `Fastify` for lightning-fast request parsing and throughput, protected by custom rate limiting.
*   **Swagger API Documentation**: Fully documented interactive endpoints.

---

## 🛠 Tech Stack

*   **Framework**: [NestJS](https://nestjs.com/) (v11.x) with Fastify adapter.
*   **Database**: [MongoDB](https://www.mongodb.com/) via Mongoose.
*   **AI Engine**: [Google Generative AI](https://ai.google.dev/) (Gemini Flash).
*   **WebSockets**: [Socket.IO](https://socket.io/).
*   **Emailing**: [Nodemailer](https://nodemailer.com/).
*   **Documentation**: [Swagger / OpenAPI](https://swagger.io/).

---

## ⚙️ Environment Variables

The server uses the following environment variables. Copy `.env.example` to `.env` to customize your values.

| Variable Name | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Port on which the NestJS server runs | `3000` |
| `MONGODB_URI` | Yes | MongoDB Connection String URI | `mongodb://localhost:27017` |
| `DB_NAME` | Yes | Target database name | `support_ticket_system` |
| `JWT_SECRET` | Yes | Secret key used for signing JWT login tokens | *Generate a random secure string* |
| `GEMINI_API_KEY` | Yes | API key from Google AI Studio | `AIzaSyC...` |
| `EMAIL_USER` | Yes | SMTP Username (for email updates) | `noreply@yourdomain.com` |
| `EMAIL_PASS` | Yes | SMTP Password or App Password | `xxxx xxxx xxxx xxxx` |
| `RESEND_API_KEY`| No | Resend API Key if using Resend for mailers | `re_xxx` |
| `DEPLOYED_URL` | No | Deployed server base URL (for Swagger document) | `https://api.tickets.yoursite.com` |

---

## 📦 Getting Started

### Prerequisites

Ensure you have the following installed locally:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [NPM](https://www.npmjs.com/)
*   [MongoDB](https://www.mongodb.com/) (either running locally or a MongoDB Atlas URI)
*   [Docker](https://www.docker.com/) (Optional, for containerized execution)

---

### 💻 Local Development Setup

1.  **Clone the Repository** and navigate to the project directory:
    ```bash
    cd ai-support-ticket-system-server
    ```

2.  **Configure Environment Variables**:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in your MongoDB connection details, JWT secret, Gmail/SMTP credentials, and Gemini API Key.

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Run in Development Mode (Watch Mode)**:
    ```bash
    npm run start:dev
    ```
    The server will start, and Swagger docs will be hosted at: `http://localhost:3000/api`

5.  **Compile & Run in Production Mode**:
    ```bash
    # Build the TypeScript files
    npm run build

    # Run the compiled JavaScript
    npm run start:prod
    ```

---

### 🐳 Running with Docker

Docker allows you to run the application in an isolated container without having to install Node.js locally.

#### 1. Build the Docker Image
Navigate to the server directory and run the following command to build the image (tagged `support-ticket-server`):
```bash
docker build -t support-ticket-server .
```

#### 2. Run the Container
Run the container and load environment variables from your local `.env` file, forwarding container port `3000` to local port `3000`:
```bash
docker run -d \
  --name ticket-server-app \
  -p 3000:3000 \
  --env-file .env \
  support-ticket-server
```

#### 3. Run with docker-compose (Recommended with MongoDB)
If you want to spin up the NestJS server along with a local MongoDB instance in one command, create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: ticket-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  server:
    build: .
    container_name: ticket-server
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - MONGODB_URI=mongodb://mongodb:27017
      - DB_NAME=support_ticket_system
      - JWT_SECRET=change-me-to-a-secure-secret-key-123!
      - GEMINI_API_KEY=YOUR_GEMINI_KEY
      - EMAIL_USER=your_email@gmail.com
      - EMAIL_PASS=your_email_app_password
    depends_on:
      - mongodb

volumes:
  mongo-data:
```
To spin it up, simply run:
```bash
docker compose up -d
```

---

## 📖 API & WebSocket Endpoints

### Swagger Documentation
Once the app is running, navigate to:
👉 **[http://localhost:3000/api](http://localhost:3000/api)**

Here you can view, test, and interact with all routes including:
*   `POST /auth/register` and `POST /auth/login`
*   `GET/POST/PUT/DELETE /tickets`
*   `POST /tickets/:id/assign` and `PUT /tickets/:id/status`
*   `GET/POST /tickets/:id/comments`

### Real-Time WebSocket Events
Client connections should target the default gateway `/` on the server port. 

**Broadcasted Events**:
*   `ticketUpdated`: Emitted when status, priority, assignee, or ticket fields are changed.
*   `commentAdded`: Emitted when a new comment is added.
*   `activityTracked`: Emitted when any new activity is logged for a ticket.

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run end-to-end (e2e) tests
npm run test:e2e

# Run test coverage
npm run test:cov
```
