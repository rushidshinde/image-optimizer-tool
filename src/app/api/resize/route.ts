import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const file = formData.get("file") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const widthStr = formData.get("width") as string | null;
    const heightStr = formData.get("height") as string | null;
    
    if (!file && !imageUrl) {
      return NextResponse.json({ error: "Please provide either a file or an image URL." }, { status: 400 });
    }
    
    let inputBuffer: Buffer;
    
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else if (imageUrl) {
      const resp = await fetch(imageUrl);
      if (!resp.ok) {
        return NextResponse.json({ error: "Failed to fetch image from URL." }, { status: 400 });
      }
      const arrayBuffer = await resp.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json({ error: "No image source found." }, { status: 400 });
    }
    
    const width = widthStr ? parseInt(widthStr, 10) : undefined;
    const height = heightStr ? parseInt(heightStr, 10) : undefined;
    
    if (!width && !height) {
      return NextResponse.json({ error: "Please provide target width or height." }, { status: 400 });
    }

    const sharpInstance = sharp(inputBuffer);
    const metadata = await sharpInstance.metadata();

    // If it's an SVG, don't modify it at all
    if (metadata.format === "svg") {
      return new NextResponse(new Blob([new Uint8Array(inputBuffer)]), {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="resized-image.svg"`,
        },
      });
    }

    // Process other image formats with sharp, resize and output as AVIF
    const optimizedBuffer = await sharpInstance
      .resize({
        width: width || undefined,
        height: width ? undefined : (height || undefined),
        fit: "inside",
        withoutEnlargement: true
      })
      .avif({ quality: 80, effort: 4 })
      .toBuffer();
    
    // Return the AVIF image as a response
    return new NextResponse(new Blob([new Uint8Array(optimizedBuffer)]), {
      status: 200,
      headers: {
        "Content-Type": "image/avif",
        "Content-Disposition": `attachment; filename="resized-image.avif"`,
      },
    });
  } catch (error) {
    console.error("Resize Error:", error);
    return NextResponse.json({ error: "Failed to resize image." }, { status: 500 });
  }
}
