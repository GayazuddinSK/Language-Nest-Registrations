# Language Nest - New Member Registration Web Application

A modern, production-ready web application for **Language Nest** (SRKR Engineering College's official communication and language community). Designed to replace Google Forms with an interactive, animated registration interface, real-time validations, Google Sheets API integration, n8n automation webhooks, and a live Admin Dashboard.

![Language Nest Banner](https://img.shields.io/badge/Language%20Nest-SRKR%20Official-2563EB?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20TailwindCSS%20%7C%20Express-3B82F6?style=for-the-badge)

---

## 🌟 Key Features

### 1. Registration Page (`/`)
- **Branded Design System**: Customized `#2563EB` primary theme, Poppins typography, glassmorphism hero cards, and fluid motion transitions.
- **Live Member Badge**: Dynamically displays the current total member count (e.g., *"247 Students have already joined."*).
- **Interactive Form & Validation**:
  - Full Name, Branch dropdown (`CSE`, `CSIT`, `CSD`, `AIML`, `ECE`, `EEE`, `MECH`, `CIVIL`, `IT`, `Others`), Academic Year dropdown (`1st Year` to `4th Year`).
  - Strict 10-digit mobile number validation and regex email format validation.
  - Server-side and client-side duplicate checking for Phone and Email against registered records.
  - Double submission protection with active loading spinner.
- **Animated Success Experience**:
  - Confetti burst effect using `canvas-confetti`.
  - Animated green checkmark with Framer Motion.
  - Displays unique registration ID badge (e.g. *"You are Member #148"*).

### 2. Live Admin Dashboard (`/admin`)
- **Password Protected**: Simple environment variable password access (`ADMIN_PASSWORD`).
- **Real-Time Metrics Cards**:
  - **Total Registrations** count.
  - **Live Registration Count** (Updates dynamically without page refresh via WebSockets/Socket.io).
  - **Today's Registrations** count.
- **Advanced Filtering & Search**: Instant filter by Name, Branch, and Academic Year.
- **CSV Export**: One-click download of all member registration records as `.csv`.

### 3. Backend & Integrations (`/server`)
- **Google Sheets API v4**: Appends new member rows with `Timestamp`, `Full Name`, `Branch`, `Year`, `Phone`, `Email`, `Status`. Features a seamless local JSON fallback mode if Google credentials are not yet configured.
- **n8n Automation Webhook**: Sends JSON payload `{ name, branch, year, phone, email, status, timestamp }` upon registration for automated WhatsApp invitation dispatch.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io, Google APIs (`googleapis`), Axios, Cors, Dotenv.
- **Primary Database**: Google Sheets API v4.
- **Automation**: n8n Webhook integration.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/language-nest-registration.git
cd "Language Nest Registration"

# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
ADMIN_PASSWORD=languagenest2026

# n8n Webhook URL (Optional for local testing)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/language-nest-registration

# Google Sheets API Credentials (Optional - App will use local JSON fallback if blank)
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 3. Run the Servers

Start the Backend Server:
```bash
cd server
npm run dev
# Running at http://localhost:5000
```

Start the Frontend App:
```bash
cd client
npm run dev
# Running at http://localhost:5173
```

Open `http://localhost:5173` in your browser to view the Registration Page, or `http://localhost:5173` -> Click **Admin Portal** (Password: `languagenest2026`).

---

## 📊 Google Sheets API Setup Guide

To connect your own Google Sheet:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project named `Language-Nest-App`.

2. **Enable Google Sheets API**:
   - Navigate to **APIs & Services > Library**.
   - Search for **Google Sheets API** and click **Enable**.

3. **Create Service Account**:
   - Go to **APIs & Services > Credentials**.
   - Click **Create Credentials > Service Account**.
   - Name it `language-nest-service-account` and click **Create and Continue**.
   - Grant role **Editor** and click **Done**.

4. **Generate JSON Key**:
   - Click on the created Service Account -> Go to **Keys** tab -> Click **Add Key > Create new key**.
   - Select **JSON** and click **Create**. Download the JSON key file.

5. **Share Google Sheet**:
   - Create a new Google Sheet (or open an existing one).
   - Copy the Service Account email address (e.g., `language-nest@project.iam.gserviceaccount.com`).
   - Click **Share** on your Google Sheet, paste the service account email, grant **Editor** access, and save.

6. **Add Credentials to Server `.env`**:
   - `GOOGLE_SHEET_ID`: Extract from sheet URL: `https://docs.google.com/spreadsheets/d/<GOOGLE_SHEET_ID>/edit`.
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `client_email` from downloaded JSON.
   - `GOOGLE_PRIVATE_KEY`: `private_key` from downloaded JSON.

---

## ⚡ n8n Automation Setup

After registration, the backend posts a JSON body to `N8N_WEBHOOK_URL`:

```json
{
  "name": "Rahul Verma",
  "branch": "CSE",
  "year": "2nd Year",
  "phone": "9876543210",
  "email": "rahul.verma@srkr.ac.in",
  "status": "Pending WhatsApp Invite",
  "timestamp": "2026-08-08 18:40:05",
  "memberId": 148
}
```

### Suggested n8n Workflow Steps:
1. **Webhook Node**: Receives POST request on registration.
2. **WhatsApp API / Evolution API / Whapi Node**: Sends automatic WhatsApp welcome message and group invite link to `{{ $json.phone }}`.
3. **HTTP Request Node**: POSTs back to backend endpoint `/api/webhook/status-update`:
   ```json
   {
     "phoneOrEmail": "9876543210",
     "status": "Invitation Sent"
   }
   ```
4. Update Google Sheet status column automatically.

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Push project to GitHub.
2. Import repository in [Vercel](https://vercel.com).
3. Set **Root Directory** to `client`.
4. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
5. Click **Deploy**.

### Backend (Render / Railway)
1. Create a Web Service in [Render](https://render.com).
2. Set **Root Directory** to `server`.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add Environment Variables (`PORT`, `ADMIN_PASSWORD`, `N8N_WEBHOOK_URL`, `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `FRONTEND_URL`).
6. Click **Deploy**.

---

## 📄 License
This project is created for **Language Nest Club - SRKR Engineering College**.
