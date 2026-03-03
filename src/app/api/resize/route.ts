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

    // Process image with sharp
    const optimizedBuffer = await sharp(inputBuffer)
      .resize({
        width: width || undefined,
        height: height || undefined,
        fit: "inside",
        withoutEnlargement: true
      })
      .toBuffer();
    
    // Return the image as a response
    return new NextResponse(new Blob([new Uint8Array(optimizedBuffer)]), {
      status: 200,
      headers: {
        "Content-Type": "image/webp", // we can detect original type or default to webp. Let's keep original format or set to jpeg/png. Actually, let's keep it format-agnostic or let sharp auto-resolve. Default sharp output based on input is typically jpeg or same format. Let's explicitly convert to webp for optimization or leave it. 
        // For a generic resizer, preserving format is best unless forced.
        "Content-Disposition": `attachment; filename="resized-image.png"`,
      },
    });
  } catch (error) {
    console.error("Resize Error:", error);
    return NextResponse.json({ error: "Failed to resize image." }, { status: 500 });
  }
}
