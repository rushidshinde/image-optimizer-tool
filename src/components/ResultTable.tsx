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
              <TableHead className="w-[30%] min-w-[250px] font-semibold text-slate-700">Image URL</TableHead>
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
                <TableCell className="font-medium">
                  <div className="max-w-[300px] truncate text-sm" title={item.src}>
                     <a href={item.src} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                       {item.src.split("/").pop() || item.src.substring(0, 50)}
                     </a>
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[300px]" title={item.src}>{item.src}</div>
                </TableCell>
                <TableCell className="text-sm">
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
