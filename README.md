# Restaurant Menu Summarizer (DXH AI Developer Task)

## About The Project

This project is a web application designed to fetch, parse, and summarize the daily menu from a restaurant's website, image, or PDF URL. It uses an AI model (OpenAI) via tool calling to extract structured menu data and caches the results for efficiency. The application includes a NestJS backend, a Python microservice for OCR/PDF processing, and a React frontend.

This project fulfills the requirements of the DXH AI Developer technical task.

---

## Features

- **URL Input:** Accepts a URL for a restaurant's menu page.
- **Content Fetching:** Retrieves content from the URL.
- **Format Handling:** Supports HTML pages, image files (PNG, JPG, etc.), and PDF files.
- **AI Extraction:** Uses OpenAI (GPT-4o/GPT-5-mini) with Tool Calling to extract menu items (name, price, category, allergens, weight) and restaurant name into a structured JSON format .
- **Daily Menu Focus:** Attempts to identify the menu specifically for the current day, handling weekly and weekend menus.
- **Error Handling:** Provides user feedback for various issues like invalid URLs, fetch errors (404, timeout), unsupported content types, or missing menus.
- **Caching:** Caches successfully extracted menus (keyed by URL + Date) in Redis to reduce API calls and improve response time . Cache TTL is set to 1 hour.
- **Interactive Frontend:** Simple React interface with dark mode, frosted glass effects, animated background, and interactive elements.
- **Dockerized:** All services (Backend, Frontend, OCR/PDF, Redis) are containerized using Docker and Docker Compose for easy setup and deployment.

---

## Tech Stack

- **Backend:** Node.js, NestJS, TypeScript
- **OCR/PDF Service:** Python, FastAPI, Pytesseract, Pdfplumber
- **Frontend:** React, TypeScript, Tailwind CSS (v3), Create React App (`react-scripts`)
- **AI:** OpenAI API (GPT-5-mini) - **Caching:** Redis - **Containerization:** Docker, Docker Compose
- **HTTP Client:** Axios
- **HTML Parsing:** Cheerio
- **Testing:** Jest (Unit & E2E), Supertest (E2E)

---

## Setup & Prerequisites

1.  **Clone the repository:**
    ```bash
    https://github.com/Soptik1290/restaurant-menu-summarizer
    ```
2.  **Install Docker Desktop:** Make sure Docker Desktop is installed and running. This is needed for Redis and running the containerized application.
3.  **Install Node.js & npm:** Required for installing dependencies and running helper scripts.
4.  **Install Python & pip:** Required for the OCR/PDF service dependencies.
5.  **Install Tesseract:** The OCR engine needs to be installed locally _if you intend to run the Python service outside of Docker_. Follow instructions for your OS (e.g., from [UB Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)). Ensure it's added to your system PATH and include the Czech (`ces`) language pack.
6.  **Create `.env` file:** In the **root** project directory, create a file named `.env` and add your OpenAI API key:
    ```dotenv
    OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```
    _(Note: This file is ignored by `.gitignore`)_

---

## Running the Application (Docker Compose - Recommended)

This is the easiest way to run the entire application (Backend, Frontend, OCR/PDF Service, Redis).

1.  **Ensure Docker Desktop is running.**
2.  Open a terminal (Git Bash recommended for consistency) in the **root** project directory.
3.  Build and start all services:
    ```bash
    docker-compose up --build
    ```
    - The `--build` flag is only needed the first time or after changing code/Dockerfiles. Subsequent starts can use `docker-compose up`.
4.  Wait for all services to build and start. You should see logs from `server`, `client`, `ocr`, and `redis`.
5.  Access the frontend in your browser at: **`http://localhost:3000`**
6.  The backend API is available at `http://localhost:3001`.
7.  The OCR/PDF service is available at `http://localhost:8000`.

To stop the application, press `Ctrl+C` in the terminal where `docker-compose up` is running.

---

## Running Services Individually (Development)

Alternatively, you can run each service in its own terminal:

1.  **Terminal 1 (Redis via Docker Compose):**
    ```bash
    # In root directory
    docker-compose up redis
    ```
2.  **Terminal 2 (OCR/PDF Service):**
    ```bash
    cd ocr-service
    # Activate virtual environment
    source venv/Scripts/activate # or .\venv\Scripts\Activate.ps1 in PowerShell
    # Install dependencies if needed
    pip install -r requirements.txt
    # Start server
    uvicorn main:app --reload
    ```
3.  **Terminal 3 (Backend Server):**
    ```bash
    cd server
    # Install dependencies if needed
    npm install
    # Start server in dev mode
    npm run start:dev
    ```
4.  **Terminal 4 (Frontend Client):**
    ```bash
    cd client
    # Install dependencies if needed
    npm install
    # Start dev server
    npm start
    ```

---

## Running Tests

Tests are run within the `server` directory.

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  **Run Unit Tests:**
    ```bash
    npm test
    ```
    - To run a specific unit test file: `npm test <filename>.spec.ts` (e.g., `npm test menu.service.spec.ts`)
3.  **Run Integration / E2E Tests:**
    ```bash
    npm run test:e2e
    ```
    - This command (defined in `server/package.json`) runs files ending in `.e2e-spec.ts`.

---

## Design Considerations & Choices

- **Technology Choice:** The core technologies used in this project – **NestJS** with **TypeScript** for the backend , **React** with **TypeScript** and **Tailwind CSS** for the frontend , **Redis** for caching , **Docker Compose** for containerization , and **Jest** for testing [cite: 117] – were largely based on the recommendations provided in the task description . These represent modern and commonly used tools in web development.
- **Learning Curve:** As I had limited to no prior experience with several of these specific frameworks and tools (particularly NestJS, React, Tailwind, and Unit/Integration testing), a significant part of the development process involved learning them. This was achieved by following tutorials, watching instructional videos, reading documentation, and utilizing AI assistance to understand concepts and troubleshoot implementation details. The resulting code reflects an effort to apply these newly learned concepts cleanly and functionally, rather than demonstrating deep expertise.
- **Web Content Retrieval & Processing:** While the task allowed for LLM-based web fetching , directly fetching content using `axios` (Option A approach) proved more reliable and controllable, especially for handling non-HTML content. `cheerio` is used for basic HTML text extraction. Recognizing the real-world challenge of image/PDF menus , dedicated Python microservices using **FastAPI**, Tesseract (OCR), and Pdfplumber were added as bonus features to significantly increase the tool's real-world usability. This microservice architecture keeps the main backend focused.
- **Caching Strategy:** A straightforward Redis cache was implemented as required , using a URL+Date key and a basic 1-hour TTL as a balance between freshness and reducing API calls.
- **Error Handling:** Implemented specific error handling for common issues (fetch failures , unsupported types , AI failures ) and providing clearer feedback on the frontend, moving beyond generic error messages as discussed in the edge cases . The AI prompt was also refined to detect "closed" statuses.
- **AI Implementation:** OpenAI API was used with **Tool Calling** to enforce the required structured JSON output . The prompt was iteratively refined in Czech to handle specific cases like weekly/weekend menus and detecting closed restaurants, which required experimentation.
- **Simplicity vs. Completeness:** While aiming to fulfill the core task and important edge cases (images, PDFs, weekend menus), features like advanced AI-based allergen guessing were omitted due to potential inaccuracy and safety concerns. The focus was on delivering a robust core functionality cleanly.

---

## Future Improvements / Discussion Points

### Planned Features (Roadmap)

- **Smart Menu Finder:** Automatically find a restaurant’s menu using only its name. The backend/AI would handle searching online sources.
- **Nearby Daily Menus:** Display daily menus of nearby restaurants based on user geolocation.
- **AI Meal Recommendations:** If no daily menu is found, have the AI suggest three recommended meals based on cuisine type, local popularity, and seasonal trends.

### Other Potential Ideas

- **Frontend E2E Tests:** Implement E2E tests for the React application using Cypress or Playwright.
- **Prompt Refinement:** Further improve the AI prompt to handle even more complex or unusual menu structures.
- **Cache Invalidation:** Implement more sophisticated cache invalidation (e.g., webhook on menu change, shorter TTL around lunchtime).
- **Deployment:** Finalize Docker configuration and deploy the application to Render or a similar platform.
- **UI/UX Polish:** Further refine UI details, animations, and potentially add loading skeletons.
- **Authentication:** Add simple API key or JWT authentication as suggested.
- **Advanced Features (From ROADMAP):**
  - Integration with Google Maps for visualization.
  - Filters by cuisine type or dietary preferences (could tie into AI analysis).
  - User accounts for saving favorites.
  - Notifications for daily lunch updates.

### Discussion Points

- **AI Allergen Guessing:** While omitted for safety, the feasibility and reliability of AI predicting potential allergens based on dish names could be discussed.
- **Tesseract Accuracy:** For OCR, Tesseract's accuracy can vary. Exploring alternative OCR services (cloud-based or other models) could be a future step if accuracy is insufficient.
- **PDF Complexity:** Currently handles text extraction from PDFs. More complex PDFs with layered text or unusual formatting might require more advanced parsing techniques.
