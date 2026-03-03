"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, Link as LinkIcon, Download, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ImageResizeForm() {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [resultObjUrl, setResultObjUrl] = useState<string | null>(null);
  const [resultExtension, setResultExtension] = useState<string>("png");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageUrl("");
    setResultObjUrl(null);
    setError("");
    setWidth("");
    setHeight("");
  };

  const handleResize = async () => {
    setError("");
    setResultObjUrl(null);

    if (activeTab === "file" && !file) {
      setError("Please select an image file to upload.");
      return;
    }
    if (activeTab === "url" && !imageUrl) {
      setError("Please provide a valid image URL.");
      return;
    }
    if (!width && !height) {
      setError("Please specify either a target width or height (or both).");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (activeTab === "file" && file) {
        formData.append("file", file);
      } else if (activeTab === "url" && imageUrl) {
        formData.append("imageUrl", imageUrl);
      }
      
      if (width) formData.append("width", width);
      if (height) formData.append("height", height);

      const response = await fetch("/api/resize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = "Failed to resize image.";
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // Ignore json parse error
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      
      // Determine extension from content-type or fallback to png
      const contentType = response.headers.get("Content-Type") || "";
      let ext = "png";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("gif")) ext = "gif";
      else if (contentType.includes("svg")) ext = "svg";
      else if (contentType.includes("avif")) ext = "avif";
      
      setResultExtension(ext);
      
      const objectUrl = URL.createObjectURL(blob);
      setResultObjUrl(objectUrl);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl">Image Source</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex border-b border-slate-200 mb-6 w-fit">
          <button
            onClick={() => setActiveTab("file")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "file" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "url" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <LinkIcon className="w-4 h-4" /> Image URL
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === "file" ? (
            <div className="space-y-3">
              <Label htmlFor="imageFile">Select Image</Label>
              <div 
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative"
                onClick={() => document.getElementById('imageFile')?.click()}
              >
                 <input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <ImageIcon className="w-10 h-10 text-blue-500" />
                    <p className="text-sm font-medium text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Upload className="w-10 h-10 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">Click to browse or drag and drop</p>
                    <p className="text-xs text-slate-500">SVG, PNG, JPG or WEBP (max. 10MB)</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="imageUrl">Target Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="max-w-full"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <Label htmlFor="width">Target Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g. 800"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Target Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 600"
                min="1"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">Leave one dimension blank to maintain original aspect ratio based on the other provided dimension.</p>
        </div>

        <div className="pt-6 flex gap-4">
          <Button onClick={handleResize} disabled={loading} size="lg" className="w-40 font-semibold shadow-md cursor-pointer disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            {loading ? "Processing..." : "Resize Image"}
          </Button>
          
          {(file || imageUrl || width || height || resultObjUrl) && (
             <Button onClick={handleReset} variant="outline" size="lg" className="shadow-sm border border-slate-200 cursor-pointer">
               Reset
             </Button>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {resultObjUrl && (
          <div className="mt-8 pt-8 border-t border-slate-200 space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Result</h3>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative border-4 border-slate-100 rounded-lg overflow-hidden bg-[url('/checkerboard.png')] bg-repeat bg-slate-50">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={resultObjUrl} alt="Resized Image" className="max-w-full h-auto max-h-[400px] object-contain" />
              </div>
              <div className="flex flex-col gap-4 min-w-[200px]">
                <Button asChild className="px-8 py-6 font-medium shadow-sm cursor-pointer text-base rounded-md">
                  <Link
                    href={resultObjUrl}
                    download={`resized-image.${resultExtension}`}
                    target="_blank"
                  >
                    <Download className="w-5 h-5 mr-2" /> Download Image
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
