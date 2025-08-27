# Neobrutalist Portfolio on Cloudflare

This project provides all the necessary files to deploy a fast, modern, and stylish portfolio website. It leverages the speed of Cloudflare's Edge network for both the static site (Pages) and the serverless API (Workers).

## Features

- **UI/UX**: Neobrutalist design with the Rosé Pine color palette.
- **Responsive**: Adapts to all screen sizes, from mobile to desktop.
- **Dynamic Content**: All text content is managed via a Google Spreadsheet.
- **Multi-language**: Support for multiple languages, configured in the spreadsheet.
- **Dark/Light Mode**: User-toggleable theme with persistence via `localStorage`.
- **GitHub Integration**: Displays your contribution graph and statistics.
- **Serverless Backend**: A Cloudflare Worker acts as a secure API gateway to fetch data.
- **Deployment**: Optimized for Cloudflare Pages and Workers.

## Project Structure


.
├── frontend/       # Static site assets (for Cloudflare Pages)
│   ├── index.html
│   ├── css/
│   └── js/
├── worker/         # Serverless API (for Cloudflare Workers)
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── wrangler.toml
├── SPREADSHEET_FORMAT.md # Guide for setting up the Google Sheet
└── README.md             # This file


---

## 🚀 Setup and Deployment Guide

Follow these steps carefully to get your portfolio live.

### Step 1: Google Spreadsheet Setup

1.  **Create the Spreadsheet**: Make a new Google Sheet. You can copy the template from [this link](https://docs.google.com/spreadsheets/d/1vC3z4sT2i_7gZJ8-AAbL-Yoh8aG2GvYk8zFqD5J6jXw/edit?usp=sharing) by going to `File > Make a copy`.
2.  **Follow the Format**: Ensure your spreadsheet has the exact sheets and columns as described in `SPREADSHEET_FORMAT.md`.
3.  **Publish to Web**: 
    - Go to `File > Share > Publish to web`.
    - In the dialog, select `Entire Document` and `Comma-separated values (.csv)`.
    - Click **Publish**. DO NOT close the dialog yet.
    - **Important**: Copy the **Spreadsheet ID** from the published URL. The URL looks like this: `https://docs.google.com/spreadsheets/d/e/SPREADSHEET_ID_HERE/pub?output=csv`. 
4.  **Get Sheet GIDs**: The `_meta` sheet is required to map sheet names to their unique `gid` values. Click on each sheet (`Home`, `About`, `Projects`, `Contact`) and copy the `gid` value from the browser's URL bar (e.g., `...#gid=123456789`). Add these to your `_meta` sheet.

### Step 2: GitHub Personal Access Token (PAT)

1.  **Generate Token**: Go to [GitHub Developer Settings](https://github.com/settings/tokens).
2.  Click `Generate new token` > `Generate new token (classic)`.
3.  Give it a name (e.g., `PortfolioAPI`).
4.  Set an expiration date.
5.  Select the following scopes: `read:user` and `public_repo`.
6.  Click `Generate token` and **copy the token immediately**. You won't see it again.

### Step 3: Cloudflare Worker (Backend API)

1.  **Install Wrangler**: If you don't have it, install the Cloudflare CLI: `npm install -g wrangler`.
2.  **Authenticate**: Run `wrangler login` and follow the prompts.
3.  **Navigate to Worker Folder**: `cd worker`
4.  **Install Dependencies**: `npm install`
5.  **Configure `wrangler.toml`**: 
    - Open `worker/wrangler.toml`.
    - Change `name = "portfolio-api"` to a unique name for your worker.
6.  **Add Secrets**: Run the following commands in the `worker` directory, replacing the placeholder values with your own.
    sh
    # Your GitHub username
    wrangler secret put GITHUB_USERNAME

    # The GitHub PAT you just created
    wrangler secret put GITHUB_PAT

    # The Google Spreadsheet ID from Step 1
    wrangler secret put SPREADSHEET_ID
    
7.  **Deploy the Worker**:
    sh
    wrangler deploy
    
8.  After deployment, Wrangler will give you a URL like `https://your-worker-name.your-subdomain.workers.dev`. **This is your API endpoint**. 

### Step 4: Cloudflare Pages (Frontend)

1.  **Push to GitHub**: Push the entire project repository to your GitHub account.
2.  **Create Pages Project**: 
    - Log in to your Cloudflare dashboard.
    - Go to `Workers & Pages` > `Create application` > `Pages` > `Connect to Git`.
    - Select your project repository.
3.  **Configure Build Settings**:
    - **Project name**: Choose a name (e.g., `my-portfolio`).
    - **Production branch**: `main` (or your default branch).
    - **Framework preset**: `None`.
    - **Build command**: Leave this blank.
    - **Build output directory**: `frontend`
4.  **Add Environment Variable**:
    - Go to `Settings` > `Environment variables`.
    - Add a **production** environment variable:
        - **Variable name**: `VITE_API_ENDPOINT`
        - **Value**: The URL of your deployed worker from Step 3 (e.g., `https://your-worker-name.your-subdomain.workers.dev`).
5.  **Save and Deploy**: Click `Save and Deploy`. Cloudflare will build and deploy your site.

### Step 5: Custom Domains (Optional but Recommended)

1.  **API Domain**: In your Cloudflare dashboard, go to your Worker (`Workers & Pages` > `portfolio-api`), click `Triggers`, and add a Custom Domain like `api.rzsite.my.id`.
2.  **Pages Domain**: In your Pages project settings, go to the `Custom domains` tab and add your main domain `rzsite.my.id`.

Your portfolio is now live! Content changes are made in the Google Sheet, and they will reflect on the site automatically (with a short cache delay).
