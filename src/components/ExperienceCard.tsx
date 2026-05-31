import { Experience } from '../types';
import InfoCard from './InfoCard';

interface ExperienceCardProps {
  experience: Experience;
  onSelect: (exp: Experience) => void;
}

export default function ExperienceCard({ experience, onSelect }: ExperienceCardProps) {
  return (
    <InfoCard
      id={experience.id}
      title={experience.title}
      subtitle={experience.company}
      timeframe={experience.timeframe}
      description={experience.description}
      tags={experience.tags}
      image={experience.image}
      alt={experience.company}
      onSelect={() => onSelect(experience)}
    />
  );
}
