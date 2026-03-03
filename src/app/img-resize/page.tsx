import { Metadata } from "next";
import { ImageResizeForm } from "@/components/ImageResizeForm";

export const metadata: Metadata = {
  title: "Image Resizer Tool | Optimize Web Images",
  description: "Quickly resize images from your local device or via URL.",
};

export default function ImageResizePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-col space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Image Resizer</h1>
          <p className="text-slate-500 text-lg">
            Upload an image or provide a URL to instantly resize it to your exact specifications.
          </p>
        </header>

        <ImageResizeForm />
      </div>
    </div>
  );
}
