# 🔍 Lost & Found Platform

A modern, full-stack collaborative platform for reporting, discovering, and recovering lost items. Built with React 19, Express.js, TypeScript, and MongoDB Atlas.

---

## ✨ Features

- **🌐 Public Access & Feed:** Anyone can browse approved lost and found items without needing to log in.
- **🔐 Secure Authentication:** Supports standard Email/Password authentication (with JWT cookies & bcrypt hashing) as well as **Google OAuth 2.0**.
- **🔍 Advanced Search & Filter:** Filter items instantly by categories, status (*Lost* / *Found*), or search keywords.
- **📝 Item Submission:** Easy reporting flow for lost or found items with image uploads.
- **🛡️ Admin Moderation Panel:** Dedicated admin dashboard to review, approve, reject, or delete submitted listings.
- **💬 Direct Messaging System:** Interactive chat system connecting item finders directly with owners.
- **⚡ Persistent Cloud Database:** Powered by MongoDB Atlas for scalable, real-time data persistence.
- **🛡️ Resilience & Safety:** Features a global React Error Boundary and robust server crash prevention.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons + Motion
- **Build Tool:** Vite

### Backend
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB Atlas (via Mongoose)
- **Auth:** JWT (JSON Web Tokens) + Bcrypt.js + Google OAuth 2.0

---

## 📁 Project Structure

```text
Lost And Found/
├── src/
│   ├── components/      # UI Components (Navbar, AdminPanel, PostForm, etc.)
│   ├── App.tsx          # Main Application Routing & State
│   ├── main.tsx         # Root Renderer & Error Boundary Wrapper
│   └── types.ts         # TypeScript Interfaces
├── server.ts            # Express REST API & MongoDB Data Layer
├── .env                 # Environment Variables (Ignored in Git)
├── package.json         # Node Dependencies & Scripts
└── vite.config.ts       # Vite Configuration
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Account (or local MongoDB instance)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/lost-and-found.git
   cd lost-and-found
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   APP_URL="http://localhost:3000"
   JWT_SECRET="your_jwt_secret_key"
   MONGODB_URI="your_mongodb_atlas_connection_string"
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 📜 Build & Deployment

To build the production bundle:
```bash
npm run build
```

To start the production server:
```bash
npm start
```

### Deploying to Render
1. Push your repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com/).
3. Connect your GitHub repository.
4. Set the build & start commands:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add your Environment Variables in the Render Dashboard (`MONGODB_URI`, `JWT_SECRET`, `APP_URL`, etc.).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).