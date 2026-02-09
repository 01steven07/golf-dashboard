"use client";

import { Input } from "@/components/ui/input";
import { HoleFormData } from "@/types/course";
import { cn } from "@/lib/utils";

interface CourseHoleTableProps {
  subCourseName: string;
  holes: HoleFormData[];
  teeNames: string[];
  onChange: (holes: HoleFormData[]) => void;
}

export function CourseHoleTable({
  subCourseName,
  holes,
  teeNames,
  onChange,
}: CourseHoleTableProps) {
  const updateHole = (index: number, field: string, value: unknown) => {
    const updated = [...holes];
    if (field === "par") {
      updated[index] = { ...updated[index], par: value as 3 | 4 | 5 | 6 };
    } else if (field === "handicap") {
      updated[index] = { ...updated[index], handicap: value as number | null };
    } else if (field.startsWith("distance_")) {
      const teeName = field.replace("distance_", "");
      updated[index] = {
        ...updated[index],
        distances: {
          ...updated[index].distances,
          [teeName]: value as number,
        },
      };
    }
    onChange(updated);
  };

  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const totalDistances: Record<string, number> = {};
  for (const tee of teeNames) {
    totalDistances[tee] = holes.reduce(
      (sum, h) => sum + (h.distances[tee] || 0),
      0
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-green-800">{subCourseName}</h4>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-green-50">
              <th className="border px-2 py-1.5 text-left w-12">H#</th>
              <th className="border px-2 py-1.5 w-16">Par</th>
              <th className="border px-2 py-1.5 w-14">HC</th>
              {teeNames.map((tee) => (
                <th key={tee} className="border px-2 py-1.5 w-20">
                  {tee}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holes.map((hole, idx) => (
              <tr key={hole.hole_number} className="hover:bg-gray-50">
                <td className="border px-2 py-1 font-medium text-center">
                  {hole.hole_number}
                </td>
                <td className="border px-1 py-1">
                  <div className="flex gap-0.5 justify-center">
                    {[3, 4, 5, 6].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateHole(idx, "par", p)}
                        className={cn(
                          "w-7 h-7 rounded text-xs font-bold transition-colors",
                          hole.par === p
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="border px-1 py-1">
                  <Input
                    type="number"
                    value={hole.handicap ?? ""}
                    onChange={(e) =>
                      updateHole(
                        idx,
                        "handicap",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="h-7 text-xs text-center w-full"
                    min={1}
                    max={18}
                  />
                </td>
                {teeNames.map((tee) => (
                  <td key={tee} className="border px-1 py-1">
                    <Input
                      type="number"
                      value={hole.distances[tee] ?? ""}
                      onChange={(e) =>
                        updateHole(
                          idx,
                          `distance_${tee}`,
                          e.target.value ? Number(e.target.value) : 0
                        )
                      }
                      className="h-7 text-xs text-center w-full"
                      placeholder="yd"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-green-50 font-bold">
              <td className="border px-2 py-1.5 text-center">計</td>
              <td className="border px-2 py-1.5 text-center">{totalPar}</td>
              <td className="border px-2 py-1.5"></td>
              {teeNames.map((tee) => (
                <td key={tee} className="border px-2 py-1.5 text-center">
                  {totalDistances[tee] || "-"}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
