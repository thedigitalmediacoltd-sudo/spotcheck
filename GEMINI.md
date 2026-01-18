# Project: SpotCheck: Bill Defender

## Project Overview

This is a React Native application built with Expo for "SpotCheck: Bill Defender", a privacy-first admin automation app for UK users. It uses Supabase for its backend, including authentication and database services. The app features OCR capabilities for scanning documents, in-app purchases for premium features, and a tab-based navigation structure. It is styled using NativeWind and Tailwind CSS.

## Building and Running

### Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root directory with the following content:
    ```
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase credentials.

### Running the application

*   **Start the development server:**
    ```bash
    npm start
    ```
*   **Run on Android:**
    ```bash
    npm run android
    ```
*   **Run on iOS:**
    ```bash
    npm run ios
    ```

### Building the application

*   **Build for iOS:**
    ```bash
    npm run build:ios
    ```
*   **Build for Android:**
    ```bash
    npm run build:android
    ```

## Authentication

The login screen is located at `app/(auth)/login.tsx`. It supports the following authentication methods:
*   Email and password (sign in and sign up)
*   Apple Sign In
*   Google Sign In

The authentication logic is handled by the functions in `services/auth.ts`.

## App Structure

The root layout of the application is in `app/_layout.tsx`. It wraps the entire app with the following providers:
*   `ErrorBoundary`
*   `QueryClientProvider`
*   `AuthProvider`
*   `PaywallProvider`

It also handles authentication logic, redirecting users to the login screen if they are not authenticated and to the main app if they are. A "Privacy Curtain" is displayed when the app is in the background to protect user privacy.

## Development Conventions

*   **Navigation:** The app uses Expo Router for file-based routing. The main navigation is structured with tabs. The main tabs are `index`, `scan`, and `chat`, defined in `app/(tabs)/_layout.tsx`. A custom tab bar is used.
*   **Styling:** The app uses [NativeWind](https://www.nativewind.dev/) and [Tailwind CSS](https://tailwindcss.com/) for styling. Utility classes are preferred over stylesheets. The Metro bundler is configured with `withNativeWind` to support NativeWind.
*   **State Management:** The app uses React Context for managing global state like authentication. For server state, it uses `@tanstack/react-query`.
*   **TypeScript:** The project is a strict TypeScript project. It uses the `@/*` path alias to refer to the root directory. The Babel configuration uses `babel-preset-expo` and the `react-native-reanimated/plugin`.
*   **Linting and Formatting:** The project is set up with TypeScript. Adhere to the existing code style and formatting.
*   **Testing:** The project has a `testsprite_tests` directory, which suggests a testing suite is in place.
