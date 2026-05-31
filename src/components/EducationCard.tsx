import { Education } from '../types';
import InfoCard from './InfoCard';

interface EducationCardProps {
  education: Education;
  onSelect: (education: Education) => void;
}

export default function EducationCard({ education, onSelect }: EducationCardProps) {
  const tags = education.tags && education.tags.length > 0 ? education.tags : [];
  
  return (
    <InfoCard
      id={education.id}
      title={education.school}
      subtitle={education.degree}
      timeframe={education.timeframe}
      description={education.location ?? ''}
      tags={tags}
      image={education.image}
      alt={education.school}
      onSelect={() => onSelect(education)}
    />
  );
}
