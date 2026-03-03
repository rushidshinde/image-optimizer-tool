# Responsive image audit tool

A Next.js application designed to audit your web pages and provide insights into responsive image optimization. It analyzes how your images render across different device viewports and offers size optimization recommendations to improve page performance and save bandwidth.

## Features

- **Multi-Viewport Auditing:** Automatically load a target URL simultaneously across Desktop, Tablet, and Mobile viewports. Features native quick-add buttons and drag-and-drop reordering.
- **Image Resizer:** Built-in tool (`/img-resize`) and API (`/api/resize`) to instantly resize and compress local or web images into AVIF, while preserving SVG vector graphics.
- **Single & Bulk Downloads:** Download individual optimized images directly from the audit results, or instantly pack them all into a `.zip` file for bulk export.
- **Dynamic Previews:** The audit results table includes visual thumbnails that auto-adjust their background contrast to ensure transparent logos/images are always visible.
- **CSV Export:** Export your results directly to a CSV file for reporting.
- **Network Interception:** Fast-tracks the auditing process by optionally blocking irrelevant domains or unsupported image formats via Playwright.
- **Image Filters:**
  - **Allowed Domains:** Restrict the audit to specific domains (e.g., your CDN) to save time and ignore third-party tracking pixels.
  - **Allowed Formats:** Filter by image extension (`png`, `jpg`, `webp`, `avif`, `svg`, etc.) to focus on specific asset types using the toggle selector.

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
2. **Viewports:** Add common viewports with a single click, or drag and drop to reorder the viewports you want to test against.
3. **Allowed Domains (Optional):** Enter a comma-separated list of domains (e.g., `cdn.example.com`). Only images from these domains will be downloaded and audited.
4. **Allowed Formats (Optional):** Select specific image formats to include in the audit. Deselect all to audit every format.
5. Click **Run Audit**.

Once the audit completes, a table will be displayed showing a preview thumbnail, the intrinsic size of each image, its rendered size on each viewport, and a suggested optimized size.

You can then **download** any natively resized image individually, or use the **Download All Optimized** button to generate a ZIP file of every optimized image on the page!

## Technologies Used

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Playwright](https://playwright.dev/) (Headless Chromium)
- [shadcn/ui](https://ui.shadcn.com/)
- [Sharp](https://sharp.pixelplumbing.com/) (High-speed image processing)
- [JSZip](https://stuk.github.io/jszip/) (Client-side zip packaging)
