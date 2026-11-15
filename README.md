# ULTRA WEB AI 🚀

**An AI-powered website builder that turns your ideas into websites.**

ULTRA WEB AI is an AI-powered website generation platform that helps users create websites using simple text prompts or a guided Smart Builder.

## ✨ Features

- **Prompt Mode:** Generate websites using natural language prompts.
- **Smart Builder:** Customize website type, name, colors, design style and sections.
- **AI Code Generation:** Generate HTML, CSS and JavaScript.
- **Live Preview:** Preview generated websites instantly.
- **ZIP Download:** Download your generated website files.
- **Local AI:** Powered by Ollama and Qwen 2.5 Coder 7B.
- **Responsive Design:** Generate websites designed for different screen sizes.

## 🛠️ Tech Stack

**Frontend:** React, Vite, CSS  
**Backend:** Node.js, Express.js  
**AI Model:** Qwen 2.5 Coder 7B  
**AI Runtime:** Ollama

## 💻 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/divyudeveloper/ULTRA-WEB-AI.git
cd ULTRA-WEB-AI
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create `server/.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

### 5. Install and run the AI model

Install Ollama, then run:

```bash
ollama pull qwen2.5-coder:7b
```

### 6. Start the backend

```bash
cd server
npm run dev
```

### 7. Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📌 Project Status

**Prototype / Active Development**

ULTRA WEB AI is currently a working prototype. More features and improvements are
