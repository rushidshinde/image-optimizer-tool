import { NextResponse } from "next/server";
import { chromium } from "playwright";

interface AuditRecord {
  src: string;
  intrinsic: {
    width: number;
    height: number;
  };
  renderMap: Record<string, { width: number; height: number }>;
}

export async function POST(req: Request) {
  const requestStartTime = performance.now();
  try {
    const body = await req.json();
    const { url, viewports, allowedDomains = [], allowedFormats = [] } = body;

    console.log(`\n================================`);
    console.log(`[Audit Started] URL: ${url}`);
    console.log(`================================`);

    if (!url || !viewports || !Array.isArray(viewports) || viewports.length === 0) {
      return NextResponse.json({ error: "Missing or invalid url/viewports parameter." }, { status: 400 });
    }

    console.log(`[0ms] Launching headless browser...`);
    const browserStartTime = performance.now();
    // Launch headless chromium using Playwright
    const browser = await chromium.launch({ headless: true });
    console.log(`[${Math.round(performance.now() - requestStartTime)}ms] Browser launched successfully. (Took ${Math.round(performance.now() - browserStartTime)}ms)`);

    // Map to keep track of every image across viewports.
    // Key: image source URL
    const imageMap = new Map<string, AuditRecord>();

    for (const vp of viewports) {
      console.log(`\n[${Math.round(performance.now() - requestStartTime)}ms] --- Starting Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const vpStartTime = performance.now();
      
      // Create a new context or page with the specific viewport size
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1, // 100% zoom
      });

      // Apply network interception for faster loading based on format/domain
      await page.route("**/*", (route) => {
        const req = route.request();
        const reqUrl = req.url();
        const resourceType = req.resourceType();

        if (resourceType === "image") {
          try {
            const parsedUrl = new URL(reqUrl);
            
            // 1. Check Domain
            if (allowedDomains.length > 0) {
              const isAllowedDomain = allowedDomains.some((domain: string) => 
                parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
              );
              if (!isAllowedDomain) {
                return route.abort();
              }
            }

            // 2. Check Format (by extension in URL)
            // Note: If an image has no extension, we let it download and filter it later if needed,
            // otherwise we might block valid images unexpectedly just because the URL lacks .jpg
            if (allowedFormats.length > 0) {
              const extMatch = parsedUrl.pathname.match(/\.([a-z0-9]+)$/i);
              if (extMatch) {
                const ext = extMatch[1].toLowerCase();
                // Map common extensions
                let normalizedExt = ext;
                if (ext === "jpeg") normalizedExt = "jpg";
                
                // If it HAS an extension and it's NOT in allowed formats, abort
                // Treat 'jpg' and 'jpeg' interchangeably based on user input
                const isAllowedFormat = allowedFormats.includes(normalizedExt) || 
                                       (normalizedExt === 'jpg' && allowedFormats.includes('jpeg')) ||
                                       (normalizedExt === 'jpeg' && allowedFormats.includes('jpg'));
                                       
                if (!isAllowedFormat) {
                   return route.abort();
                }
              }
            }

            return route.continue();
          } catch (e) {
            console.error(e);
            // Unparseable URL, let it through or abort? Let's continue to be safe
            return route.continue();
          }
        }

        // Allow all non-image requests
        return route.continue();
      });

      // Try to go to the URL and wait for the page load event ensuring images are loaded
      try {
        console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Navigating to URL (waiting for 'load')...`);
        const navStartTime = performance.now();
        await page.goto(url, { waitUntil: "load", timeout: 45000 });
        console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Navigation complete. (Took ${Math.round(performance.now() - navStartTime)}ms)`);
        
        console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Starting auto-scroll to trigger lazy-loads...`);
        const scrollStartTime = performance.now();
        // Scroll to the bottom to trigger all lazy-loaded images
        await page.evaluate(async () => {
          await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              // Give an absolute max scroll height or check if we reached bottom
              if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 20000) {
                clearInterval(timer);
                resolve();
              }
            }, 50); // Fast enough, but triggers observers
          });
        });
        console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Auto-scroll complete. (Took ${Math.round(performance.now() - scrollStartTime)}ms)`);

        console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Waiting for <img> tags to finish downloading...`);
        const imgWaitStartTime = performance.now();
        // Explicitly wait for all image tags on the page to fully load their sources
        await page.evaluate(async () => {
          const images = Array.from(document.querySelectorAll("img"));
          await Promise.all(
            images.map((img) => {
              if (img.complete || !img.src) return Promise.resolve();
              return new Promise<void>((resolve) => {
                // Add a fallback timeout in case load/error never fires (e.g., aborted requests)
                const fallbackTimeout = setTimeout(resolve, 5000);
                
                img.onload = () => {
                  clearTimeout(fallbackTimeout);
                  resolve();
                };
                img.onerror = () => {
                  clearTimeout(fallbackTimeout);
                  resolve();
                };
              });
            })
          );
        });
        console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Img tags downloaded. (Took ${Math.round(performance.now() - imgWaitStartTime)}ms)`);

        console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Waiting for network idle (fallback 10s)...`);
        const idleStartTime = performance.now();
        // Optionally wait a bit for any late-loading scripts/images
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
        console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Network idle wait finished. (Took ${Math.round(performance.now() - idleStartTime)}ms)`);
      } catch (err) {
        console.warn(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Timeout or error while loading:`, err);
        // We catch the error so we can still evaluate whatever images managed to load
      }

      console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Extracting DOM image data...`);
      const extractStartTime = performance.now();
      // Evaluate script in the page to extract <img> data
      const viewportImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs.map((img) => {
          const rect = img.getBoundingClientRect();
          return {
            src: img.currentSrc || img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            renderedWidth: rect.width,
            renderedHeight: rect.height,
          };
        });
      });
      console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Extraction complete. Found ${viewportImages.length} tags. (Took ${Math.round(performance.now() - extractStartTime)}ms)`);

      // Map the extracted images to our global map
      let skippedCount = 0;
      viewportImages.forEach((img) => {
        // Skip base64 or empty sources to keep things clean, but keep HTTP ones
        if (!img.src || img.src.startsWith("data:")) {
           skippedCount++;
           return;
        }
        
        try {
          const parsedUrl = new URL(img.src);
          
          // Final Domain Filter (in case some slipped through or were already in DOM)
          if (allowedDomains.length > 0) {
            const isAllowedDomain = allowedDomains.some((domain: string) => 
              parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
            );
            if (!isAllowedDomain) {
              skippedCount++;
              return;
            }
          }

          // Final Format Filter
          if (allowedFormats.length > 0) {
            const extMatch = parsedUrl.pathname.match(/\.([a-z0-9]+)$/i);
            if (extMatch) {
                const ext = extMatch[1].toLowerCase();
                let normalizedExt = ext;
                if (ext === "jpeg") normalizedExt = "jpg";
                
                const isAllowedFormat = allowedFormats.includes(normalizedExt) || 
                                       (normalizedExt === 'jpg' && allowedFormats.includes('jpeg')) ||
                                       (normalizedExt === 'jpeg' && allowedFormats.includes('jpg'));
                                       
                if (!isAllowedFormat) {
                   skippedCount++;
                   return;
                }
            } else {
               // If there is NO extension in the URL, we might want to still allow it, 
               // OR we can strictly block. For now, let's allow it so we don't drop dynamic images.
               // We could check the content-type but that requires fetching it first.
            }
          }
        } catch (e) {
            console.error(e);
            // Invalid URL, keep it or skip? Let's skip.
            skippedCount++;
            return;
        }

        if (!imageMap.has(img.src)) {
          imageMap.set(img.src, {
            src: img.src,
            intrinsic: { width: img.naturalWidth, height: img.naturalHeight },
            renderMap: {},
          });
        }

        const record = imageMap.get(img.src);
        if (record) {
          // Store the MAX rendered dimensions for this specific viewport
          const existing = record.renderMap[vp.name];
          const newWidth = Math.round(img.renderedWidth);
          const newHeight = Math.round(img.renderedHeight);
          
          record.renderMap[vp.name] = {
            width: existing ? Math.max(existing.width, newWidth) : newWidth,
            height: existing ? Math.max(existing.height, newHeight) : newHeight,
          };
        }
      });
      console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [${vp.name}] Skipped ${skippedCount} base64/empty images.`);

      await page.close();
      console.log(`[${Math.round(performance.now() - requestStartTime)}ms] --- Finished Viewport: ${vp.name} (Total Viewport Time: ${Math.round(performance.now() - vpStartTime)}ms) ---\n`);
    }

    await browser.close();

    console.log(`[${Math.round(performance.now() - requestStartTime)}ms] Processing final results array...`);
    // Process our map into the final array and compute the max rendered sizes
    const results = Array.from(imageMap.values()).map((record) => {
      let maxRenderedWidth = 0;
      let maxRenderedHeight = 0;

      for (const deviceResult of Object.values(record.renderMap)) {
        if (deviceResult.width > maxRenderedWidth) maxRenderedWidth = deviceResult.width;
        if (deviceResult.height > maxRenderedHeight) maxRenderedHeight = deviceResult.height;
      }

      return {
        src: record.src,
        intrinsic: record.intrinsic,
        renderMap: record.renderMap,
        suggested: {
          width: maxRenderedWidth,
          height: maxRenderedHeight,
        },
      };
    });

    console.log(`[${Math.round(performance.now() - requestStartTime)}ms] [Audit Complete] Returning ${results.length} unique images. Total Request Time: ${Math.round(performance.now() - requestStartTime)}ms\n`);

    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error(`[${Math.round(performance.now() - requestStartTime)}ms] Audit API Error:`, error);
    let errorMessage = "An error occurred during the audit";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

