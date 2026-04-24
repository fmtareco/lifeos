# lifeOS

A personal life operating system — track your time, balance your areas of life, and score your days.

Built with **Java 21 + Spring Boot 3** backend and a **vanilla JS** single-page frontend served by the same JAR.

---

## Quick start (dev)

### Prerequisites
- Java 21+
- Maven 3.9+ (or use the wrapper: `./mvnw`)

### Run

```bash
cd lifeos
./mvnw spring-boot:run
```

Open **http://localhost:8080** in any browser.

Default credentials (dev): **admin / changeme**

Override in your shell before running:
```bash
export APP_USER=myname
export APP_PASS=mysecretpassword
./mvnw spring-boot:run
```

The app uses an **H2 file database** (`./data/lifeos-db`) that persists between restarts.
Default data (areas, activities, routines, tasks) is seeded automatically on first run.

---

## Deploy to Railway (free cloud hosting)

This gets you a public HTTPS URL accessible from any device, anywhere.

### Step 1 — Push to GitHub

```bash
cd lifeos
git init
git add .
git commit -m "initial"
# create a repo at github.com, then:
git remote add origin https://github.com/YOURNAME/lifeos.git
git push -u origin main
```

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) → sign up with GitHub (free)
2. **New Project** → **Deploy from GitHub repo** → select `lifeos`
3. Railway detects Maven and builds automatically (~3 min)

### Step 3 — Add PostgreSQL

In your Railway project:
1. Click **+ New** → **Database** → **PostgreSQL**
2. Railway provisions the DB and automatically sets `DATABASE_URL`, `PGUSER`, `PGPASSWORD` as environment variables in your service

### Step 4 — Set your credentials

In Railway → your service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `APP_USER` | your chosen username |
| `APP_PASS` | a strong password |

Railway redeploys automatically. Your app is live at `https://yourapp.up.railway.app`.

### Step 5 — Android PWA

Open Chrome on Android → navigate to your Railway URL → tap ⋮ → **Add to Home screen**.
The app installs full-screen like a native app, with your session persisting between uses.

---

## Security

- All routes require login (Spring Security form login + HTTP Basic)
- Session cookie is `HttpOnly` and scoped to the domain
- CSRF protection on state-changing requests; exempted for `/api/**` (REST clients)
- Credentials are never stored in the frontend — they live in env vars on the server
- To sign out: click **⎋ out** in the top-right corner, or navigate to `/logout`
- If your session expires (Railway restarts the service), you're redirected to the login page automatically

---

## Project structure

```
lifeos/
├── Procfile                              ← Railway start command
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/lifeos/
    │   │   ├── LifeOsApplication.java
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java   ← auth, login page, session
    │   │   │   └── WebConfig.java        ← SPA routing
    │   │   ├── model/                    ← JPA entities (9 tables)
    │   │   ├── repository/               ← Spring Data JPA
    │   │   ├── service/
    │   │   │   ├── ScoreEngine.java      ← day scoring algorithm
    │   │   │   ├── AgendaService.java    ← auto-agenda suggestions
    │   │   │   └── DataSeeder.java       ← seeds defaults on first run
    │   │   └── controller/
    │   │       └── ApiControllers.java   ← all REST endpoints
    │   └── resources/
    │       ├── application.yml           ← dev (H2) + prod (PostgreSQL) profiles
    │       └── static/
    │           ├── index.html            ← full SPA
    │           ├── login.html            ← login page
    │           ├── api.js                ← REST client
    │           └── manifest.json         ← PWA manifest
    └── test/
```

---

## Environment variables reference

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_USER` | `admin` | Login username |
| `APP_PASS` | `changeme` | Login password — **always override in prod** |
| `DATABASE_URL` | — | Set automatically by Railway PostgreSQL |
| `PGUSER` | `lifeos` | Set automatically by Railway |
| `PGPASSWORD` | — | Set automatically by Railway |
| `PORT` | `8080` | Set automatically by Railway |
| `SPRING_PROFILES_ACTIVE` | — | Set to `prod` via Procfile |

---

## REST API

All endpoints require authentication (session cookie or HTTP Basic).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/areas` | List areas |
| PUT | `/api/areas/{id}` | Create / update |
| DELETE | `/api/areas/{id}` | Delete |
| GET/PUT/DELETE | `/api/activities/{id}` | Activities |
| GET/PUT/DELETE | `/api/projects/{id}` | Projects |
| GET/PUT/DELETE | `/api/tasks/{id}` | Tasks |
| GET/PUT/DELETE | `/api/routines/{id}` | Routines |
| GET/PUT/DELETE | `/api/events/{id}` | Events |
| GET/PUT/DELETE | `/api/periods/{id}` | Periods |
| GET/PUT/DELETE | `/api/balance/{id}` | Balance weights |
| GET | `/api/actions?date=yyyy-MM-dd` | Actions for a day |
| PUT | `/api/actions/{id}` | Log an action |
| GET | `/api/score/day/{date}` | Day score |
| GET | `/api/agenda/suggest/{date}` | Today's suggestions |
| POST | `/logout` | Sign out |


---

## Quick start (dev)

### Prerequisites
- Java 21+
- Maven 3.9+ (or use the wrapper: `./mvnw`)

### Run

```bash
cd lifeos
./mvnw spring-boot:run
```

Open **http://localhost:8080** in any browser.

The app uses an **H2 file database** (`./data/lifeos-db`) that persists between restarts.  
Default data (areas, activities, routines, tasks) is seeded automatically on first run.

### H2 console (dev only)
http://localhost:8080/h2-console  
JDBC URL: `jdbc:h2:file:./data/lifeos-db`  Username: `sa`  Password: *(empty)*

---

## Access from other devices (phones, tablets, other laptops)

The app runs on your machine's local network. Find your IP:

```bash
# macOS / Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

Then open `http://<your-ip>:8080` on any device on the same Wi-Fi.

### Android — "Add to Home Screen"
1. Open Chrome on Android → navigate to `http://<your-ip>:8080`
2. Tap ⋮ → *Add to Home screen*
3. The app installs as a PWA and opens full-screen like a native app

---

## Production deployment

### Switch to PostgreSQL

1. Start PostgreSQL and create a database:
```sql
CREATE DATABASE lifeos;
CREATE USER lifeos WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE lifeos TO lifeos;
```

2. Uncomment the PostgreSQL driver in `pom.xml` and comment out H2.

3. Run with the prod profile:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod \
  -Dspring-boot.run.arguments="--DB_USER=lifeos --DB_PASS=changeme"
```

Or set environment variables:
```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_USER=lifeos
export DB_PASS=changeme
./mvnw spring-boot:run
```

### Build a deployable JAR
```bash
./mvnw clean package -DskipTests
java -jar target/lifeos-0.0.1-SNAPSHOT.jar
```

---

## Project structure

```
lifeos/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/lifeos/
    │   │   ├── LifeOsApplication.java       ← entry point
    │   │   ├── config/
    │   │   │   └── WebConfig.java           ← CORS + SPA routing
    │   │   ├── model/                       ← JPA entities
    │   │   │   ├── Area.java
    │   │   │   ├── Activity.java
    │   │   │   ├── Project.java
    │   │   │   ├── Task.java
    │   │   │   ├── Routine.java
    │   │   │   ├── Event.java
    │   │   │   ├── Period.java
    │   │   │   ├── Balance.java
    │   │   │   └── Action.java              ← history log entry
    │   │   ├── repository/                  ← Spring Data JPA repos
    │   │   ├── service/
    │   │   │   ├── ScoreEngine.java         ← day scoring algorithm
    │   │   │   ├── AgendaService.java       ← auto-agenda suggestions
    │   │   │   └── DataSeeder.java          ← seeds defaults on first run
    │   │   └── controller/
    │   │       └── ApiControllers.java      ← all REST endpoints
    │   └── resources/
    │       ├── application.yml              ← dev (H2) + prod (PostgreSQL) profiles
    │       └── static/
    │           ├── index.html               ← full SPA (UI preserved from v1)
    │           ├── api.js                   ← REST client (replaces IndexedDB)
    │           └── manifest.json            ← PWA manifest
    └── test/
        ├── java/com/lifeos/
        │   └── LifeOsApplicationTests.java
        └── resources/
            └── application-test.yml        ← in-memory H2 for tests
```

---

## REST API reference

All endpoints are under `/api/`. Use PUT for both create and update (client generates the ID).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/areas` | List all areas |
| PUT | `/api/areas/{id}` | Create or update area |
| DELETE | `/api/areas/{id}` | Delete area |
| GET | `/api/activities` | List all activities |
| PUT | `/api/activities/{id}` | Create or update |
| GET | `/api/projects` | List all projects |
| PUT | `/api/projects/{id}` | Create or update |
| GET | `/api/tasks` | List all tasks |
| PUT | `/api/tasks/{id}` | Create or update |
| GET | `/api/routines` | List all routines |
| PUT | `/api/routines/{id}` | Create or update |
| GET | `/api/events` | List all events |
| PUT | `/api/events/{id}` | Create or update |
| GET | `/api/periods` | List all periods |
| PUT | `/api/periods/{id}` | Create or update |
| GET | `/api/balance` | All area/period weights |
| PUT | `/api/balance/{id}` | Create or update weight |
| GET | `/api/actions` | All actions (log entries) |
| GET | `/api/actions?date=yyyy-MM-dd` | Actions for a specific day |
| GET | `/api/actions?from=…&to=…` | Actions in date range |
| GET | `/api/actions/dates` | List of distinct dates with data |
| PUT | `/api/actions/{id}` | Log or update an action |
| DELETE | `/api/actions/{id}` | Delete an action |
| GET | `/api/score/day/{date}` | Compute score for one day |
| GET | `/api/score/range?from=…&to=…` | Scores for a date range |
| GET | `/api/agenda/suggest/{date}` | Auto-agenda suggestions |

---

## Extending the backend

The pattern is consistent throughout:

1. Add a field to a `model/` entity → JPA updates the schema automatically (dev) or via migration (prod)
2. Add a query to the `repository/` interface if needed
3. Add business logic to a `service/` class
4. Expose it via `controller/ApiControllers.java`
5. Call it from `static/api.js` and wire it into `index.html`

---

## Data persistence

- **Dev**: H2 file at `./data/lifeos-db.mv.db` — survives restarts, portable, zero config
- **Prod**: PostgreSQL — multi-user, networked, production-grade
- **Backup**: Use the *↓ export .md* or *↓ export .xlsx* buttons in the History tab at any time
