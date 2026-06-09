# 🤖 ResumeCraft AI — AI-Powered Resume Screening & Matcher

> An intelligent resume screening and job matching platform powered by Google Gemini AI.

![ResumeCraft AI](https://img.shields.io/badge/AI-Gemini%20Powered-blue?style=for-the-badge&logo=google)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=for-the-badge&logo=vite)

---

## ✨ Features

- **📄 Resume Screener** — Upload a resume and get an instant AI-powered match score against a job description
- **🎯 Job Target Matcher** — Find the best-fit job roles for any resume
- **📊 Dashboard** — Track scan history, average scores, and analytics
- **👤 User Profiles** — Per-user scan history stored locally
- **⚙️ Settings** — Configure your Gemini API key, model selection, and demo/live mode
- **🔐 Auth System** — Simple login with admin/user role support
- **📱 Fully Responsive** — Works seamlessly on desktop, tablet, and mobile
- **🗂️ Collapsible Sidebar** — Icon-only collapsed mode on desktop, drawer mode on mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Vanilla CSS (Glassmorphism design system) |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| Icons | Lucide React |
| Storage | localStorage / sessionStorage |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repo
git clone https://github.com/Pavan-SCI/AI-Powerd-resume-screening.git
cd AI-Powerd-resume-screening

# Install frontend dependencies
cd frontend
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5174`

### Configuration

1. Open the app and log in (default admin: `admin` / `admin123`)
2. Go to **Settings** → paste your Gemini API Key
3. Toggle off **Demo Mode** to use live AI analysis

---

## 📁 Project Structure

```
AI-Powerd-resume-screening/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.tsx          # Login screen
│   │   │   ├── Dashboard.tsx     # Main dashboard
│   │   │   ├── Screener.tsx      # Resume screener
│   │   │   ├── JobMatcher.tsx    # Job matcher
│   │   │   ├── Profile.tsx       # User profile
│   │   │   ├── Settings.tsx      # Settings page
│   │   │   └── Sidebar.tsx       # Responsive sidebar
│   │   ├── App.tsx               # Root component
│   │   ├── index.css             # Global design system
│   │   └── main.tsx              # Entry point
│   └── package.json
└── README.md
```

---

## 📸 Screenshots

| Dashboard | Resume Screener | Settings |
|-----------|----------------|----------|
| Analytics & stats | Upload & analyze | API configuration |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this project for learning and personal projects.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/Pavan-SCI">Pavan</a>
</div>