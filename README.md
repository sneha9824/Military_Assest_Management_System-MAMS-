# Military Asset Management System (M.A.M.S.)

A complete, production-style take-home assignment for managing the movement, assignment, and expenditure of critical assets across multiple military bases.

## Project Architecture

* **Backend**: Node.js, Express, MySQL (`mysql2`), JWT Authentication, bcrypt, centralized Error Handling and Audit Logging.
* **Frontend**: React (Vite), Tailwind CSS (Military Theme), Recharts (KPI Analytics), Lucide Icons, Axios, React Router.
* **Database**: MySQL (Using the pre-existing schema provided).

## Setup Instructions

### 1. Database
The system uses the existing `militery_assest_management` schema.
Ensure your MySQL server is running on `localhost:3306` with the credentials:
- User: `root`
- Password: `root`

### 2. Backend Setup
```bash
cd backend
npm install
node seed.js  # Ensures default users are present
npm run dev   # Starts server on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev   # Starts Vite on http://localhost:5173
```

## Demo Credentials (All passwords are: `password123`)
1. **Admin**: `admin@military.gov` (Full access, can view audit logs)
2. **Base Commander**: `commander@military.gov` (Restricted to Base 1 logic)
3. **Logistics Officer**: `logistics@military.gov` (Can only access Purchases & Transfers)

## Key Features Implemented
* **Strict RBAC & JWT Security**: API limits data depending on the JWT token payload. Base Commanders can't transfer assets out of bases they do not command.
* **Atomic Transactions**: Transfers use MySQL `BEGIN`, `FOR UPDATE` row-locking, and `COMMIT` to ensure stock is perfectly synchronized across bases without race conditions.
* **Audit Logger**: A middleware that intercepts successful `POST/PATCH` actions and dynamically writes to the `audit_logs` table (stripping passwords).
* **Military UI/UX**: Deep Navy and Olive green palette, responsive KPI cards, and SVG charts via Recharts.

## Assumptions
* "Assigned" assets still count as belonging to the base but are not available for transfer (enforced by keeping `current_balance` accurate and querying `assignments` separately).
* Expenditures permanently delete stock from `current_balance`.
