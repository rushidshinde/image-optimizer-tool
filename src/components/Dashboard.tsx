"use client";

import { useState } from "react";
import { Plus, Trash, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

export function Dashboard() {
  const ALL_FORMATS = ["png", "jpg", "jpeg", "webp", "svg", "gif", "avif"];
  
  const [url, setUrl] = useState("https://example.com");
  const [allowedDomains, setAllowedDomains] = useState("");
  const [allowedFormats, setAllowedFormats] = useState<string[]>(ALL_FORMATS);
  const [viewports, setViewports] = useState<Viewport[]>([
    { name: "Desktop", width: 1920, height: 1080 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Mobile", width: 375, height: 667 },
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [error, setError] = useState("");

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

  const handleRunAudit = async () => {
    setLoading(true);
    setResults([]);
    setError("");

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
                className="max-w-xl text-lg"
              />
              <div className="grid grid-cols-1 gap-6 max-w-2xl">
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
                    <div className="space-x-2">
                       <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setAllowedFormats(ALL_FORMATS)}>All</Button>
                       <span className="text-slate-300 text-xs">|</span>
                       <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setAllowedFormats([])}>None</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_FORMATS.map(fmt => {
                      const isSelected = allowedFormats.includes(fmt);
                      return (
                        <Button
                          key={fmt}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setAllowedFormats(allowedFormats.filter(f => f !== fmt));
                            } else {
                              setAllowedFormats([...allowedFormats, fmt]);
                            }
                          }}
                          className={`text-xs h-7 rounded-full ${isSelected ? 'bg-slate-800' : 'text-slate-500'}`}
                        >
                          {fmt}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between max-w-2xl">
                <Label>Viewports</Label>
                <Button variant="outline" size="sm" onClick={addViewport}>
                  <Plus className="w-4 h-4 mr-1" /> Add Viewport
                </Button>
              </div>
              
              <div className="space-y-3 max-w-2xl">
                {viewports.map((vp, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm">
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
                    <div className="flex items-end h-full mb-1">
                      <Button variant="ghost" size="icon" onClick={() => removeViewport(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

             <div className="pt-4 flex gap-4">
              <Button onClick={handleRunAudit} disabled={loading || !url} size="lg" className="w-40 font-semibold shadow-md">
                {loading ? "Scanning..." : "Run Audit"}
              </Button>
              
              {results.length > 0 && (
                <Button onClick={handleExport} variant="secondary" size="lg" className="shadow-sm border border-slate-200">
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

        {results.length > 0 && <ResultTable results={results} viewports={viewports} />}

      </div>
    </div>
  );
}
