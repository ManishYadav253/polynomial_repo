# 🧮 Polynomial Calculator & Calculus Toolkit

An interactive mathematical computing platform that combines a high-performance C++ mathematical engine algorithm design with an elegant, modern glassmorphism web interface.

![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![C++](https://img.shields.io/badge/C++-17-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🌟 Overview

**PolyCalc** is a web-based computational environment designed for students, educators, and engineers. It performs advanced polynomial operations, calculus derivations, numerical root finding, and linear algebra matrices from scratch, visualizing function curves dynamically with step-by-step explanations.

---

## ✨ Features

### 📐 1. Polynomial Operations
- **Addition, Subtraction, & Multiplication** with full term expansion and reduction.
- **Polynomial Long Division** with quotient and remainder expressions.
- **Function Composition $f(g(x))$** and polynomial evaluation at any point $x$.
- **Equality Comparison** and term simplification.

### 📈 2. Calculus Toolkit
- **Symbolic Differentiation**: Computes $f'(x)$ using the Power Rule and Sum Rule with step-by-step derivation.
- **Indefinite Integration**: Computes $\int f(x) \, dx$ with integration constant $+C$.
- **Definite Integration**: Evaluates $\int_a^b f(x) \, dx$ via the Fundamental Theorem of Calculus with area-under-curve computation.

### 🎯 3. Root Finder
- **Automatic Exact Roots**: Quadratic formula solver supporting real and complex conjugate roots ($a+bi$).
- **Newton-Raphson Numerical Solver**: High-precision iterative root finding with initial guess configuration.
- **Convergence Chart**: Interactive Chart.js graph tracking error $|f(x)|$ and root approximation over iterations.

### 📊 4. Interactive Graph Plotter
- Multi-curve plotting ($f(x)$, derivative $f'(x)$, and antiderivative $F(x)$).
- Smooth zoom & pan controls powered by Chart.js & Hammer.js.
- Hover tooltips displaying exact $(x, y)$ coordinates.

### 🔲 5. Matrix Operations
- **Grid Builder**: Dynamic $N \times M$ matrix matrix inputs (up to $6 \times 6$).
- **Matrix Addition & Multiplication**.
- **Determinant & Inverse Matrix**: Gauss-Jordan elimination with singularity detection.
- **Row Echelon Form**: Gaussian elimination with step-by-step row transformations.

### 📚 6. Formula Reference Library & Utilities
- Interactive cards covering derivative rules, integral identities, and polynomial theorems.
- One-click "Try Example" shortcuts pre-filling calculator inputs.
- Calculation history with JSON and CSV export capabilities.
- JWT authentication for user account history persistence.

---

## 🏗️ Architecture & Technology Stack

```
                     ┌────────────────────────────────┐
                     │   Modern Glassmorphism SPA     │
                     │  HTML5 · CSS3 · Vanilla JS     │
                     │  Chart.js · GSAP · Lucide      │
                     └───────────────┬────────────────┘
                                     │ REST API (Fetch)
                                     ▼
                     ┌────────────────────────────────┐
                     │   Express Node.js Server       │
                     │  JWT Auth · JSON Storage       │
                     └───────────────┬────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌────────────────────────┐              ┌────────────────────────┐
    │  C++ Engine Headers    │              │  Pure JS Engine        │
    │ (Native CPP Engine)    │              │ (Algorithm Port)       │
    └────────────────────────┘              └────────────────────────┘
```

- **Frontend**: Vanilla HTML5, CSS custom properties design system, Glassmorphism components, GSAP micro-animations, Chart.js graphs, Lucide icon system.
- **Backend**: Node.js & Express REST API backend with JSON-file persistence.
- **Engine Core**: C++ header-only algorithms (`polynomial.h`, `calculus.h`, `roots.h`, `matrix.h`) paired with a 1-to-1 pure JavaScript math engine fallback for universal cross-platform deployment.

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (packaged with Node.js)

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ManishYadav23/polynomial_repo.git
   cd polynomial_repo
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Access in Browser**
   Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

---

## 📂 Project Structure

```
polynomial_repo/
├── backend/
│   ├── cpp/                  # C++ Math Engine Header Files
│   │   ├── polynomial.h
│   │   ├── calculus.h
│   │   ├── roots.h
│   │   └── matrix.h
│   ├── db.json               # Local JSON Database
│   ├── math-engine.js        # JavaScript Mathematical Engine
│   ├── server.js             # Express Backend Server & API Routes
│   └── package.json          # Backend Dependencies
├── frontend/
│   ├── css/                  # Styling & Animations
│   │   ├── main.css
│   │   ├── glassmorphism.css
│   │   ├── animations.css
│   │   └── responsive.css
│   ├── js/                   # Frontend SPA Modules
│   │   ├── api.js            # API Client
│   │   ├── app.js            # Router & Application Core
│   │   ├── auth.js           # Authentication Module
│   │   ├── calculator.js     # Polynomial Operations UI
│   │   ├── calculus.js       # Calculus UI
│   │   ├── dashboard.js      # Dashboard Widgets
│   │   ├── formula-library.js# Reference Cards
│   │   ├── graph.js          # Chart.js Graphing Module
│   │   ├── history.js        # History & Exports
│   │   ├── matrix.js         # Matrix Operations UI
│   │   ├── particles.js      # Particle Background
│   │   ├── result-renderer.js# Step-by-step HTML Builder
│   │   └── roots.js          # Root Finder & Convergence Chart
│   └── index.html            # Main Single Page Application
├── README.md                 # Project Documentation
└── .gitignore                # Git Ignore Configuration
```

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/polynomial/add` | Add two polynomials |
| `POST` | `/api/polynomial/divide` | Polynomial long division |
| `POST` | `/api/calculus/differentiate` | Compute derivative $f'(x)$ |
| `POST` | `/api/calculus/integrate` | Compute indefinite integral $\int f(x) \, dx$ |
| `POST` | `/api/calculus/definite-integral` | Definite integral over $[a, b]$ |
| `POST` | `/api/roots/solve` | Find polynomial roots (quadratic / linear) |
| `POST` | `/api/roots/newton-raphson` | Newton-Raphson numerical root solver |
| `POST` | `/api/graph/data` | Generate curve points for graphing |
| `POST` | `/api/matrix/determinant` | Calculate matrix determinant |
| `POST` | `/api/matrix/inverse` | Calculate matrix inverse |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
