interface Semester {
  name: string;
  classes: string[];
}

interface SemesterCardProps {
  semester: Semester;
}

export default function SemesterCard({ semester }: SemesterCardProps) {
  return (
    <div className="rounded-2xl border border-brand-secondary/30 bg-brand-bg/5 p-5">
      <h4 className="font-semibold text-brand-text mb-3">{semester.name}</h4>
      <ul className="space-y-2 text-sm text-brand-text/70 list-disc list-inside">
        {semester.classes.map((course) => (
          <li key={course}>{course}</li>
        ))}
      </ul>
    </div>
  );
}
