# Image Audit Tool

A Next.js application designed to audit your web pages and provide insights into responsive image optimization. It analyzes how your images render across different device viewports and offers size optimization recommendations to improve page performance and save bandwidth.

## Features

- **Multi-Viewport Auditing:** Automatically load a target URL simultaneously across Desktop, Tablet, and Mobile viewports (or any custom viewports you define).
- **Network Interception:** Fast-tracks the auditing process by optionally blocking irrelevant domains or unsupported image formats via Playwright network interception.
- **Image Filters:**
  - **Allowed Domains:** Restrict the audit to specific domains (e.g., your CDN) to save time and ignore third-party tracking pixels.
  - **Allowed Formats:** Filter by image extension (`png`, `jpg`, `webp`, `avif`, `svg`, etc.) to focus on specific asset types.
- **Smart Dimension Tracking:** Correctly tracks the maximum rendered dimensions of an image even if it is used multiple times on a single page.
- **CSV Export:** Export your results directly to a CSV file for reporting.

## Getting Started

First, install the dependencies. The project uses `pnpm` for package management:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the Dashboard.

## Usage

1. **Target URL:** Enter the full URL (e.g., `https://example.com`) you want to audit.
2. **Viewports:** Add, remove, or modify the viewports (Width x Height) you want to test against.
3. **Allowed Domains (Optional):** Enter a comma-separated list of domains (e.g., `cdn.example.com`). Only images from these domains will be downloaded and audited.
4. **Allowed Formats (Optional):** Select specific image formats to include in the audit. Deselect all to audit every format.
5. Click **Run Audit**.

Once the audit completes, a table will be displayed showing the intrinsic size of each image, its rendered size on each viewport, and a suggested optimized size (the maximum dimensions required across all tested viewports).

## Technologies Used

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Playwright](https://playwright.dev/) (Headless Chromium)
- [shadcn/ui](https://ui.shadcn.com/)
