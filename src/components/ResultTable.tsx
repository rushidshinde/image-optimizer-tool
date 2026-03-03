"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { AuditResult, Viewport } from "./Dashboard";

export function ResultTable({ results, viewports }: { results: AuditResult[]; viewports: Viewport[] }) {
  if (!results || results.length === 0) return null;

  return (
    <Card className="overflow-hidden shadow-sm border-slate-200 mt-8">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
