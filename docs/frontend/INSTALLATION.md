# Frontend Installation & Setup Guide

This guide details how to set up and run the Smooth Frontend for the Student Attendance System.

## Prerequisites

- **Node.js**: v18 or higher recommended.
- **npm** or **yarn**.

## Installation

1.  Navigate to the frontend directory:
    ```bash
    cd front-end/smooth-frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

## Environment Variables

Create a `.env` file in the `front-end/smooth-frontend` root if one doesn't exist. Usually, Vite handles this automatically for local dev, but for production, you need to specify the API URL.

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Running Development Server

To start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (by default).

## Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## Linting

To check for code quality issues:

```bash
npm run lint
```
