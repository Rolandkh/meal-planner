# Meal Planner App

A weekly meal planning application that helps you organize your meals, shopping lists, and recipes.

## Features

- 📅 Weekly meal plan overview
- 🛒 Interactive shopping list with progress tracking
- 📖 Detailed daily meal plans with recipes
- ⚡ Special handling for fast days and post-fast days
- 💾 Local storage persistence for shopping list items
- 📱 Mobile-friendly responsive design

## Project Structure

```
├── src/
│   ├── components/     # React/Vue components or vanilla JS modules
│   ├── styles/         # CSS stylesheets
│   ├── data/           # Data models and initial data
│   └── utils/          # Utility functions
├── index.html          # Main HTML file
├── package.json        # Project dependencies
└── README.md          # This file
```

## Getting Started

The app uses ES6 modules, so it must be served from a web server (not opened directly as a file).

### Option 1: Using npm serve (Recommended)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the URL shown (typically `http://localhost:3000`)

### Option 2: Using Python

If you have Python installed:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Using VS Code Live Server

If you're using VS Code, install the "Live Server" extension and right-click on `index.html` to "Open with Live Server".

## Usage

- Navigate through the week using the home page
- Check off items in the shopping list as you purchase them
- View detailed recipes and prep instructions for each day
- Special indicators show fast days and post-fast days

## Technologies

- Vanilla JavaScript (ES6 Modules)
- HTML5
- CSS3
- LocalStorage API

## Deployment

This app is ready to deploy to Vercel, Netlify, or any static hosting service. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.
