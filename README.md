# ✈️ QuickTrip

QuickTrip is a modern **trip planner** that helps users find cheap flights under a specified budget.  
It scrapes travel sites using **Playwright with Chromium** to fetch flight data, manages trip plans, and provides a seamless UI for browsing deals.  

The project uses a **React frontend**, an **Express + Node.js backend**, and a **MongoDB database**.  

---

## 🚀 Features

- 🔍 **Flight Scraper** – finds cheap flights via **Chromium (Playwright)**  
- 💸 **Budget Filtering** – search flights under a user’s specified budget  
- 📝 **Trip Planner** – save, edit, and organize your travel plans  
- 🌍 **Modern UI** – fast and responsive React-based frontend  
- 📦 **Full-Stack Setup** – Node.js + Express backend with MongoDB  
- 🔑 **Secure API Keys** – MongoDB and Groq support  

---

## 🛠 Tech Stack

**Frontend**
- React (Vite)  
- Axios (API calls)  
- TailwindCSS (styling)  

**Backend**
- Node.js with Express  
- Playwright + Chromium (web scraping)  
- MongoDB (Atlas or local instance)  

**Tools**
- Nodemon (backend dev)  
- Yarn / NPM (package managers)  

---

## 📂 Project Structure

QuickTrip/
├── backend/ # Express.js backend + Playwright scraping
│ ├── index.js # Entry point for Node.js server
│ └── ...
├── frontend/ # React (Vite) frontend
│ ├── src/
│ └── ...
├── README.md
└── package.json

## ⚡ Getting Started

### 1. Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)  
- [Yarn](https://yarnpkg.com/) or NPM  
- [MongoDB Atlas](https://www.mongodb.com/atlas) account  
- Chromium (installed automatically by Playwright, but you can also install manually)  

### 2. Clone the repo
```bash
git clone https://github.com/JanZacariasGarcia/QuickTrip.git
cd QuickTrip
