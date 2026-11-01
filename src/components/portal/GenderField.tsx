import { GENDERS, type Gender } from "@/lib/admin-record-rules";

export function GenderField({ value, onChange }: { value: Gender | ""; onChange: (v: Gender | "") => void }) {
  return <label className="block text-sm font-semibold">Gender
    <select className="field mt-2" value={value} onChange={(e) => {
      const g = GENDERS.find((option) => option.value === e.target.value);
      onChange(g?.value ?? "");
    }}>
      <option value="">Not provided</option>
      {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
    </select>
  </label>;
}