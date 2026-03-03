"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Archive } from "lucide-react";
import JSZip from "jszip";
import { AuditResult, Viewport } from "./Dashboard";

export function ResultTable({ results, viewports }: { results: AuditResult[]; viewports: Viewport[] }) {
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownload = async (item: AuditResult, index: number) => {
    setDownloading(prev => ({ ...prev, [index]: true }));
    try {
      const suggestedWidth = item.suggested?.width || item.intrinsic?.width;
      const suggestedHeight = item.suggested?.height || item.intrinsic?.height;
      if (!suggestedWidth && !suggestedHeight) throw new Error("No dimensions available");

      const formData = new FormData();
      formData.append("imageUrl", item.src);
      if (suggestedWidth) formData.append("width", suggestedWidth.toString());
      if (suggestedHeight) formData.append("height", suggestedHeight.toString());

      const response = await fetch("/api/resize", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Failed to resize");
      
      const blob = await response.blob();
      const contentType = response.headers.get("Content-Type") || "";
      let ext = "png";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("gif")) ext = "gif";
      else if (contentType.includes("svg")) ext = "svg";
      else if (contentType.includes("avif")) ext = "avif";

      const originalName = item.src.split("/").pop() || "image";
      const baseName = originalName.split(".")[0] || "image";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}_optimized.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download image", err);
      alert("Failed to download optimized image.");
    } finally {
      setDownloading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      
      const fetchImage = async (item: AuditResult, index: number) => {
          const suggestedWidth = item.suggested?.width || item.intrinsic?.width;
          const suggestedHeight = item.suggested?.height || item.intrinsic?.height;
          const formData = new FormData();
          formData.append("imageUrl", item.src);
          if (suggestedWidth) formData.append("width", suggestedWidth.toString());
          if (suggestedHeight) formData.append("height", suggestedHeight.toString());
          
          const response = await fetch("/api/resize", { method: "POST", body: formData });
          if (!response.ok) return null;
          
          const blob = await response.blob();
          const contentType = response.headers.get("Content-Type") || "";
          let ext = "png";
          if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
          else if (contentType.includes("webp")) ext = "webp";
          else if (contentType.includes("gif")) ext = "gif";
          else if (contentType.includes("svg")) ext = "svg";
          else if (contentType.includes("avif")) ext = "avif";
          
          const originalName = item.src.split("/").pop() || `image_${index}`;
          const baseName = originalName.split(".")[0] || `image_${index}`;
          
          return { name: `${baseName}_optimized.${ext}`, blob };
      };

      for (let i = 0; i < results.length; i += 5) {
          const batch = results.slice(i, i + 5);
          const batchResults = await Promise.all(batch.map((item, idx) => fetchImage(item, i + idx)));
          for (const res of batchResults) {
              if (res) zip.file(res.name, res.blob);
          }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "optimized_images.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download zip", err);
      alert("Failed to download optimized images.");
    } finally {
      setDownloadingAll(false);
    }
  };

  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Audit Results</h3>
        <Button 
          onClick={handleDownloadAll} 
          disabled={downloadingAll}
          className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
        >
          {downloadingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
          {downloadingAll ? `Generating ZIP...` : `Download All Optimized`}
        </Button>
      </div>
      <Card className="overflow-hidden shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[80px] font-semibold text-slate-700">Preview</TableHead>
              <TableHead className="w-[30%] min-w-[200px] font-semibold text-slate-700">Image Name</TableHead>
              <TableHead className="font-semibold text-slate-700">Intrinsic Size</TableHead>
              {viewports.map((vp, i) => (
                <TableHead key={i} className="font-semibold text-slate-700">{vp.name} Rendered</TableHead>
              ))}
              <TableHead className="font-semibold text-blue-700">Suggested Optimized Size</TableHead>
              <TableHead className="w-[100px] font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((item, idx) => (
              <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <a href={item.src} target="_blank" rel="noopener noreferrer" className="block relative w-12 h-12 rounded-md overflow-hidden border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-blue-500 transition-all group">
                    {/* Using standard img instead of Next Image since we are loading arbitrary URLs which might fail next.config.js checks */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.src} 
                      alt="Thumbnail" 
                      crossOrigin="anonymous"
                      className="absolute inset-0 w-full h-full object-contain mix-blend-normal z-10"
                      loading="lazy"
                      onLoad={(e) => {
                        try {
                          const img = e.currentTarget;
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          
                          // Sample a small portion for performance
                          canvas.width = 50; 
                          canvas.height = 50;
                          ctx.drawImage(img, 0, 0, 50, 50);
                          
                          const imgData = ctx.getImageData(0, 0, 50, 50);
                          const data = imgData.data;
                          
                          let r = 0, g = 0, b = 0, count = 0;
                          
                          // Calculate average color, ignoring fully transparent pixels
                          for (let i = 0; i < data.length; i += 4) {
                            if (data[i + 3] > 0) { // If pixel is not transparent
                              r += data[i];
                              g += data[i + 1];
                              b += data[i + 2];
                              count++;
                            }
                          }
                          
                          if (count > 0) {
                            r = Math.floor(r / count);
                            g = Math.floor(g / count);
                            b = Math.floor(b / count);
                            
                            // Calculate perceived brightness (standard formula)
                            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                            
                            // If the image is bright, make the background dark slate. If image is dark, make it a light slate.
                            const parent = img.parentElement;
                            if (parent) {
                              if (brightness > 180) {
                                parent.style.backgroundColor = '#1e293b'; // slate-800
                              } else {
                                parent.style.backgroundColor = '#f8fafc'; // slate-50
                              }
                            }
                          }
                        } catch {
                          // Ignore cross-origin canvas errors for remote images
                          // Just fallback to the default CSS background color
                        }
                      }}
                    />
                  </a>
                </TableCell>
                <TableCell className="font-medium align-middle">
                  <div className="max-w-[250px] truncate text-sm" title={item.src}>
                    {item.src.split("/").pop() || item.src.substring(0, 50)}
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[250px]" title={item.src}>{item.src}</div>
                </TableCell>
                <TableCell className="text-sm align-middle">
                  {item.intrinsic?.width}x{item.intrinsic?.height} px
                </TableCell>
                {viewports.map((vp, i) => {
                  const dims = item.renderMap[vp.name];
                  return (
                    <TableCell key={i} className="text-sm">
                      {dims ? `${dims.width}x${dims.height} px` : "-"}
                    </TableCell>
                  );
                })}
                <TableCell className="font-bold text-blue-600">
                  {item.suggested?.width}x{item.suggested?.height} px
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(item, idx)}
                    disabled={downloading[idx]}
                    title="Download optimized image"
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    {downloading[idx] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </Card>
    </div>
  );
}
