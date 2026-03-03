"use client";

import { useState } from "react";
import { Plus, Trash, Download, BadgeCheck, Badge, GripVertical, Activity, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ResultTable } from "@/components/ResultTable";
import Papa from "papaparse";

export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export interface AuditResult {
  src: string;
  intrinsic: {
    width: number;
    height: number;
  };
  renderMap: Record<string, { width: number; height: number }>;
  suggested: {
    width: number;
    height: number;
  };
}

const COMMON_VIEWPORTS: Viewport[] = [
  { name: "Desktop FHD", width: 1920, height: 1080 },
  { name: "Laptop", width: 1366, height: 768 },
  { name: "Desktop HD", width: 1280, height: 720 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Mobile Large", width: 414, height: 896 },
  { name: "Mobile", width: 375, height: 667 },
];

export function Dashboard() {
  const ALL_FORMATS = ["png", "jpg", "jpeg", "webp", "svg", "gif", "avif"];
  
  const [url, setUrl] = useState("https://example.com");
  const [allowedDomains, setAllowedDomains] = useState("");
  const [allowedFormats, setAllowedFormats] = useState<string[]>(ALL_FORMATS);
  const [viewports, setViewports] = useState<Viewport[]>([
    COMMON_VIEWPORTS[0], // Desktop FHD (1920x1080)
    COMMON_VIEWPORTS[3], // Tablet (768x1024)
    COMMON_VIEWPORTS[5], // Mobile (375x667)
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const addViewport = () => {
    setViewports([...viewports, { name: "New Device", width: 1280, height: 720 }]);
  };

  const removeViewport = (index: number) => {
    setViewports(viewports.filter((_, i) => i !== index));
  };

  const updateViewport = (index: number, field: keyof Viewport, value: string | number) => {
    const newVp = [...viewports];
    if (field === "name") {
      newVp[index][field] = String(value);
    } else {
      newVp[index][field] = Number(value);
    }
    setViewports(newVp);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    // Needed for Firefox drag and drop
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newViewports = [...viewports];
    const draggedItem = newViewports[draggedItemIndex];
    
    newViewports.splice(draggedItemIndex, 1);
    newViewports.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setViewports(newViewports);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleRunAudit = async () => {
    setLoading(true);
    setResults([]);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url, 
          viewports,
          allowedDomains: allowedDomains.split(",").map(d => d.trim()).filter(Boolean),
          allowedFormats 
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to audit");
      setResults(data.results || []);
      
      const count = data.results?.length || 0;
      if (count === 0) {
        setSuccessMessage("Audit successful, but no images matching the criteria were found on the page.");
      } else {
        setSuccessMessage(`Audit successful! Found ${count} image${count === 1 ? '' : 's'} on the page.`);
      }
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

  const handleExport = () => {
    if (!results.length) return;
    
    // Prepare data for export
    // Map dynamic column names based on viewports included in results
    const csvData = results.map((item: AuditResult) => {
      const row: Record<string, string> = {
        "Image URL": item.src,
        "Intrinsic Size (W x H)": `${item.intrinsic?.width}x${item.intrinsic?.height}`,
      };
      
      // Dynamic rendering columns
      for (const [vpName, dim] of Object.entries(item.renderMap || {})) {
        row[`${vpName} (Rendered)`] = `${dim.width}x${dim.height}`;
      }

      row["Suggested Optimized Size (W x H)"] = `${item.suggested?.width}x${item.suggested?.height}`;
      return row;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const urlObj = URL.createObjectURL(blob);
    link.href = urlObj;
    link.setAttribute("download", "image-audit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Responsive Image Audit Tool</h1>
          <p className="text-slate-500 text-lg">Analyze how your images render across different viewports and get size optimization recommendations.</p>
        </header>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="url">Target URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="max-w-full text-lg"
              />
              <div className="grid grid-cols-1 gap-6 max-w-full">
                <div className="space-y-3">
                  <Label htmlFor="allowedDomains">Allowed Domains (Optional)</Label>
                  <Input
                    id="allowedDomains"
                    value={allowedDomains}
                    onChange={(e) => setAllowedDomains(e.target.value)}
                    placeholder="e.g. cdn.example.com, images.com"
                    className="text-sm"
                  />
                  <p className="text-xs text-slate-500">Comma-separated list of domains to audit. If empty, all domains are audited.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Allowed Formats</Label>
                    <ToggleGroup 
                      variant="outline"
                      type="single"
                      size="sm"
                      value={allowedFormats.length === ALL_FORMATS.length ? "all" : allowedFormats.length === 0 ? "none" : ""}
                      onValueChange={(val) => {
                        if (val === "all") setAllowedFormats(ALL_FORMATS);
                        else if (val === "none") setAllowedFormats([]);
                      }}
                    >
                      <ToggleGroupItem value="all" className="h-7 text-xs px-3">All</ToggleGroupItem>
                      <ToggleGroupItem value="none" className="h-7 text-xs px-3">None</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_FORMATS.map(fmt => {
                      const isSelected = allowedFormats.includes(fmt);
                      return (
                        <Toggle
                          key={fmt}
                          pressed={isSelected}
                          onPressedChange={(pressed) => {
                            if (pressed) {
                              setAllowedFormats([...allowedFormats, fmt]);
                            } else {
                              setAllowedFormats(allowedFormats.filter(f => f !== fmt));
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-3 gap-1.5 rounded-full uppercase cursor-pointer data-[state=on]:bg-slate-800 data-[state=on]:text-white text-slate-500"
                        >
                          {isSelected ? <BadgeCheck className="w-3.5 h-3.5" /> : <Badge className="w-3.5 h-3.5" />}
                          {fmt}
                        </Toggle>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between max-w-full">
                <Label className="text-base text-slate-800">Viewports</Label>
                <Button variant="outline" size="sm" onClick={addViewport}>
                  <Plus className="w-4 h-4 mr-1" /> Add Custom
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-500 mr-1 font-medium">Quick Add:</span>
                {COMMON_VIEWPORTS.map(vp => (
                  <Button
                    key={vp.name}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2.5 rounded-full border-dashed text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                    onClick={() => setViewports([...viewports, { ...vp }])}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {vp.name} ({vp.width}x{vp.height})
                  </Button>
                ))}
              </div>
              
              <div className="space-y-3 max-w-full mt-4">
                {viewports.map((vp, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-3 bg-white p-3 rounded-md border shadow-sm transition-all duration-200 ${draggedItemIndex === index ? 'opacity-50 border-slate-300 bg-slate-50' : 'border-slate-100'}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="w-1/3 space-y-1">
                      <Label className="text-xs text-slate-400">Name</Label>
                      <Input 
                        value={vp.name} 
                        onChange={(e) => updateViewport(index, "name", e.target.value)} 
                        placeholder="Name" 
                      />
                    </div>
                    <div className="w-1/4 space-y-1">
                      <Label className="text-xs text-slate-400">Width</Label>
                      <Input 
                        type="number" 
                        value={vp.width} 
                        onChange={(e) => updateViewport(index, "width", parseInt(e.target.value) || 0)} 
                        placeholder="Width" 
                      />
                    </div>
                    <div className="w-1/4 space-y-1">
                      <Label className="text-xs text-slate-400">Height</Label>
                      <Input 
                        type="number" 
                        value={vp.height} 
                        onChange={(e) => updateViewport(index, "height", parseInt(e.target.value) || 0)} 
                        placeholder="Height" 
                      />
                    </div>
                    <div className="flex items-end h-full mb-1 ms-auto">
                      <Button variant="ghost" size="icon" onClick={() => removeViewport(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

             <div className="pt-4 flex gap-4">
              <Button onClick={handleRunAudit} disabled={loading || !url} size="lg" className="w-40 font-semibold shadow-md cursor-pointer disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                {loading ? "Scanning..." : "Run Audit"}
              </Button>
              
              {results.length > 0 && (
                <Button onClick={handleExport} variant="secondary" size="lg" className="shadow-sm border border-slate-200 cursor-pointer">
                  <Download className="w-4 h-4 mr-2" /> Export to CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {successMessage && !loading && !error && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg border border-blue-200 flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {results.length > 0 && <ResultTable results={results} viewports={viewports} />}

      </div>
    </div>
  );
}
