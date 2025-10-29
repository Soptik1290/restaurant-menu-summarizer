# 🍽️ Restaurant Menu Summarizer

**Live Application:** [**https://stark-dev.tech**](https://stark-dev.tech)

## 📖 About The Project

This project is a full-stack web application designed to fetch, parse, and summarize the daily menu from a restaurant's website, image, or PDF URL. It uses an AI model (OpenAI) via tool calling to extract structured menu data and caches the results in Redis.

The application is fully containerized with Docker and features a complete CI/CD pipeline using GitHub Actions for automatic testing and deployment to a Hetzner Cloud VPS.

This project fulfills all core requirements, mandatory tasks (caching, testing), and several bonus objectives (Docker, FE design, advanced error handling, E2E tests) of the DXH AI Developer technical task.

---

## 🚀 Features

- **Multi-Format Input:** Accepts a URL for a restaurant's menu, supporting:
  - **HTML** pages (parsed with Cheerio)
  - **Images** (PNG, JPG, etc., processed by a Tesseract OCR microservice)
  - **PDF** files (processed by a Pdfplumber microservice)
- **AI Extraction:** Uses OpenAI (GPT-5-mini) with Tool Calling to extract structured JSON data (name, price, category, etc.).
- **Smart Date Handling:** Prompt is engineered to find the menu for the current day, including complex cases like "Weekend Menus" or pages with incorrect date formatting.
- **Persistent Caching:** Caches successful results in **Redis** (keyed by URL + Date, 1-hour TTL) to reduce API calls and improve speed.
- **Robust Error Handling:** Frontend displays user-friendly messages for 404s, timeouts, unsupported file types, or if the AI detects the restaurant is closed.
- **Polished Frontend:**
  - Dark mode UI with "frosted glass" effects using **Tailwind CSS**.
  - Animated emoji background for visual appeal.
  - Interactive "Dynamic Island" style input pill for submitting new URLs or refreshing.
  - Side-by-side JSON viewer with a "Copy to Clipboard" button.
- **CI/CD Pipeline:**
  - **Continuous Integration (CI):** On every push, GitHub Actions automatically runs backend unit tests, backend E2E tests (with a live Redis service), and frontend build tests.
  - **Continuous Deployment (CD):** On a successful push to `main`, GitHub Actions automatically builds and pushes new Docker images to GitHub Container Registry (GHCR), then connects to the production server via SSH to pull the new images and restart the application.
- **Production Deployment:**
  - Hosted on a **Hetzner Cloud VPS**.
  - Served via a **Nginx Reverse Proxy** (running on the host) for routing.
  - Secured with **HTTPS** using a free Let's Encrypt SSL certificate (managed by Certbot).

---

## 🛠️ Tech Stack

- **Backend:** Node.js, NestJS, TypeScript
- **OCR/PDF Service:** Python, FastAPI, Pytesseract, Pdfplumber
- **Frontend:** React, TypeScript, Tailwind CSS (v3), Create React App (`react-scripts`)
- **AI:** OpenAI API (GPT-5-mini)
- **Caching:** Redis
- **Containerization:** Docker, Docker Compose
- **Deployment:** Hetzner Cloud VPS, Nginx (Reverse Proxy), GitHub Actions (CI/CD)
- **Testing:** Jest (Unit), Supertest (Backend E2E), Cypress (Frontend E2E)
- **HTTP Client:** Axios
- **HTML Parsing:** Cheerio

---

## ⚙️ Setup & Prerequisites (For Local Development)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Soptik1290/restaurant-menu-summarizer.git](https://github.com/Soptik1290/restaurant-menu-summarizer.git)
    cd restaurant-menu-summarizer
    ```
2.  **Install Docker Desktop:** Must be running.
3.  **Install Node.js & npm:** Required for installing dependencies and running helper scripts.
4.  **Install Python & pip:** Required for the OCR/PDF service dependencies.
5.  **Install Tesseract:** The OCR engine needs to be installed locally _if you intend to run the Python service outside of Docker_. Follow instructions for your OS (e.g., from [UB Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)). Ensure it's added to your system PATH and include the Czech (`ces`) language pack.
6.  **Create Root `.env` file:** Create a `.env` in the project root for `docker-compose`:
    ```dotenv
    OPENAI_API_KEY=sk-xxxxxxxx
    ```
7.  **Create Server `.env` file:** Create `server/.env` for `npm run start:dev`:
    ```dotenv
    OCR_SERVICE_URL=http://localhost:8000
    ```
8.  **Create Client `.env` file:** Create `client/.env` for `npm start`:
    ```dotenv
    REACT_APP_API_URL=http://localhost:3001
    ```
    _(All `.env` files are ignored by `.gitignore`)_

---

## 💻 Running Locally (Development)

For local development, it’s recommended to run the services manually in 4 terminals for clarity and hot reload:

1.  **Terminal 1 (Redis):**
    ```bash
    # In the project root
    docker compose up redis
    ```
2.  **Terminal 2 (OCR/PDF Service):**
    ```bash
    cd ocr-service
    # Activate virtual environment
    source venv/Scripts/activate
    # Start the server
    uvicorn main:app --reload
    ```
3.  **Terminal 3 (Backend Server):**
    ```bash
    cd server
    # Start the server in dev mode
    npm run start:dev
    ```
4.  **Terminal 4 (Frontend Client):**
    ```bash
    cd client
    # Start the dev server
    npm start
    ```
    - The app will be available at `http://localhost:3000`.

---

## ☁️ Production Deployment (Hetzner & CI/CD)

This project is automatically deployed to `https://stark-dev.tech` using GitHub Actions.

- **CI (`ci.yml`):** Runs on every push/PR. It executes backend unit tests, backend E2E tests (against a live Redis service), and the frontend build.
- **CD (`cd.yml`):** Runs **only on push to `main`** (after CI succeeds).
  1.  Builds and pushes Docker images for `server`, `ocr`, and `client` to GitHub Container Registry (GHCR).
  2.  Uses SSH to connect to the Hetzner VPS.
  3.  Copies the `docker-compose.prod.yml` and `.env` file (created from GitHub Secrets) to the server.
  4.  Logs into GHCR, pulls the new images, and restarts the services using `docker compose -f docker-compose.prod.yml up -d`.

The live server uses Nginx as a reverse proxy (running on the host) to route traffic from `https://stark-dev.tech` to the appropriate containers and provides an SSL certificate via Certbot.

---

## 🧪 Running Tests

### Backend (Server)

1.  Navigate to the server directory: `cd server`
2.  **Run Unit Tests:** `npm test` (or `npm test menu.service.spec.ts`)
3.  **Run Integration / E2E Tests:** `npm run test:e2e` (runs `menu.e2e-spec.ts` and `cache.e2e-spec.ts`)

### Frontend (Client)

1.  Navigate to the client directory: `cd client`
2.  Run the React dev server: `npm start`
3.  In a **separate terminal** (also in `client`): `npx cypress open`
4.  Select `app.cy.ts` to run the E2E test.

---

## 💡 Design Considerations & Choices

- **Technology Choice:** The core technologies (NestJS, React, Redis, Docker) were largely based on the recommendations provided in the task description. These represent modern and commonly used tools.
- **Learning Curve:** As I had limited prior experience with several of these tools (particularly NestJS, React, and CI/CD pipelines), a significant part of the development process involved learning them. This was achieved by following tutorials, reading documentation, and utilizing AI assistance to troubleshoot implementation details.
- **Microservice Architecture:** Recognizing the different requirements for OCR/PDF processing, a dedicated Python/FastAPI microservice was created. This keeps the main NestJS backend clean and focused purely on orchestration and AI logic.
- **CI/CD Pipeline:** GitHub Actions was chosen to automate testing and deployment. The pipeline separates testing (CI) from deployment (CD), building and pushing images to GHCR for a robust and fast deployment to the Hetzner VPS.
- **Error Handling:** Implemented specific error handling for common issues (404s, timeouts, unsupported types, AI failures) to provide clearer feedback on the frontend. The AI prompt was also refined to detect "closed" statuses.
- **AI Implementation:** OpenAI API was used with Tool Calling to enforce the required structured JSON output. The prompt was iteratively refined in Czech to handle specific cases like weekly/weekend menus.
- **Simplicity vs. Completeness:** Features like AI-based allergen guessing were omitted due to potential inaccuracy and safety concerns. The focus was on delivering a robust core functionality cleanly.

---

## 🔮 Future Improvements / Discussion

### 🗺️ Roadmap

- **Smart menu finder by restaurant name:** Backend/AI automatically discovers the official site and menu URL.
- **Nearby daily menus:** Show offers based on the user’s geolocation.
- **AI meal recommendations:** If no daily menu is found, suggest 3 relevant dishes by cuisine, popularity, and season.
- **Smarter cache invalidation:** Shorter TTL around lunchtime; manual admin invalidation.
- **Authentication and rate limiting:** Simple API key or JWT; protect against abuse.
- **Observability:** Structured logs, metrics, and tracing (e.g., OpenTelemetry) for `server` and `ocr-service`.
- **OCR/PDF quality:** Language detection, deskew, binarization, better heuristics for table-like PDFs.
- **I18n & accessibility:** EN/CZ UI, basic a11y (contrast, keyboard nav, ARIA roles).

### 💡 Additional ideas

- **Prompt refinement:** Handle unusual structures (weekend menus, multilingual pages, seasonal cards).
- **Filters and personalization:** Cuisine, dietary preferences, price range.
- **Favorites and notifications:** Save restaurants, notify about new daily menus.
- **Maps integration:** Visualize venues and navigation (Google Maps / OpenStreetMap).
- **History and comparison:** Archive daily menus and compare across restaurants.

### 🧪 Quality and testing

- **Contract tests** between `server` and `ocr-service` (stable APIs and schemas).
- **OCR edge-case tests:** Diacritics, noise, low resolution, skew, lighting artifacts.
- **Frontend visual regression:** Cypress component/E2E + visual snapshots.
- **Load testing:** k6/Artillery for throughput, latency, cache behavior.

### 🔐 Security

- **Interface protection:** Rate limiting, input validation, CORS, payload size limits.
- **Secrets management:** `.env` for local only; in production use CI/CD secrets or a KV store.
- **Auditability:** Audit logs, basic RBAC for admin operations (e.g., cache invalidation).

### 🤔 Discussion points

- **AI Allergen Guessing:** While omitted for safety, the feasibility and reliability of AI predicting potential allergens based on dish names could be discussed.
- **Tesseract Accuracy:** For OCR, Tesseract's accuracy can vary. Exploring alternative OCR services (cloud-based or other models) could be a future step if accuracy is insufficient.
- **PDF Complexity:** Currently handles text extraction from PDFs. More complex PDFs with layered text or unusual formatting might require more advanced parsing techniques.
