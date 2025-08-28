# Rex Industries Workflow Planner

This is a comprehensive workflow and production planner application built with React and TypeScript.

## 🚀 Getting Started

This application uses a simple build process with `esbuild` and is designed to be deployed to a hosting service like Firebase.

### Prerequisites

-   [Node.js and npm](https://nodejs.org/en/download/) installed on your machine.
-   [Firebase CLI](https://firebase.google.com/docs/cli#setup_update) installed globally: `npm install -g firebase-tools`.

### Setup and Deployment Steps

1.  **Download Files**: Place all the project files into a new, empty folder.

2.  **Add API Key**: Open the `config.ts` file and replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual Google Gemini API key.

3.  **Install Dependencies**: Open your terminal in the project's root folder and run the following command. This will download all the necessary tools (`esbuild`, `react`, etc.).
    ```bash
    npm install
    ```

4.  **Initialize Firebase**:
    -   Run `firebase login` to sign in to your Google account.
    -   Run the following command to set up Firebase Hosting:
        ```bash
        firebase init hosting
        ```
    -   When prompted:
        -   Select **"Use an existing project"** and choose your Firebase project.
        -   For **"What do you want to use as your public directory?"**, enter `dist`.
        -   For **"Configure as a single-page app?"**, enter `y` (Yes).
        -   For **"Set up automatic builds with GitHub?"**, enter `N` (No).

5.  **Deploy the Application**: Run the following single command. It will automatically build your application and deploy it to Firebase.
    ```bash
    npm run deploy
    ```

After deployment is complete, Firebase will give you a "Hosting URL". Open this URL in your browser to see your live application.