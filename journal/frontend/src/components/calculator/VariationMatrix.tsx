"use client";

import { type VariationRow } from "@/lib/calculator";

interface VariationMatrixProps {
  matrix: VariationRow[];
  currentStop: number;
}

export default function VariationMatrix({ matrix, currentStop }: VariationMatrixProps) {
  if (matrix.length === 0) return null;

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2a2e39]">
        <h3 className="text-[13px] font-semibold text-white">Matrix de Variación</h3>
        <p className="text-[11px] text-[#787b86]">Stops alternativos manteniendo el mismo riesgo</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-[#787b86] uppercase">
              <th className="text-left px-4 py-2 font-medium">Stop</th>
              <th className="text-right px-4 py-2 font-medium">Distancia</th>
              <th className="text-right px-4 py-2 font-medium">%</th>
              <th className="text-right px-4 py-2 font-medium">Shares</th>
              <th className="text-right px-4 py-2 font-medium">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, index) => {
              const isCurrentStop = Math.abs(row.stopPrice - currentStop) < 0.01;

              return (
                <tr
                  key={index}
                  className={`text-[13px] border-t border-[#2a2e39] transition-colors ${
                    isCurrentStop
                      ? "bg-[#26a69a]/10 text-white"
                      : "text-[#a0a8b8] hover:bg-[#2a2e39]/50"
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono">
                    ${row.stopPrice.toFixed(2)}
                    {isCurrentStop && (
                      <span className="ml-2 text-[10px] text-[#26a69a] font-medium">ACTUAL</span>
                    )}
                  </td>
                  <td className="text-right px-4 py-2.5 font-mono">
                    ${row.distance.toFixed(2)}
                  </td>
                  <td className="text-right px-4 py-2.5 font-mono">
                    {row.distancePercent.toFixed(2)}%
                  </td>
                  <td className={`text-right px-4 py-2.5 font-mono font-semibold ${
                    isCurrentStop ? "text-[#26a69a]" : ""
                  }`}>
                    {row.shares}
                  </td>
                  <td className="text-right px-4 py-2.5 font-mono">
                    ${row.riskAmount.toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
