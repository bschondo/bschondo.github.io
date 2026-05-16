import { motion } from 'motion/react';
import { Experience } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface ExperienceCardProps {
  experience: Experience;
  onSelect: (exp: Experience) => void;
}

export default function ExperienceCard({ experience, onSelect }: ExperienceCardProps) {
  return (
    <motion.div
      layoutId={`card-${experience.id}`}
      onClick={() => onSelect(experience)}
      className="group relative bg-brand-secondary/20 border border-brand-secondary/40 rounded-2xl cursor-pointer hover:bg-brand-secondary/30 hover:border-brand-primary/40 transition-colors duration-300 overflow-hidden flex flex-col md:flex-row"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Image Section */}
      <div className="w-full md:w-1/3 h-48 md:h-auto overflow-hidden">
        <motion.img 
          layout
          layoutId={`image-${experience.id}`}
          src={experience.image}
          alt={experience.company}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100"
          referrerPolicy="no-referrer"
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 p-8 md:p-10 relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <motion.h3 
              layout
              layoutId={`title-${experience.id}`}
              className="text-2xl font-bold text-brand-text mb-1 group-hover:text-brand-primary transition-colors"
            >
              {experience.title}
            </motion.h3>
            <motion.p 
              layout
              layoutId={`company-${experience.id}`}
              className="text-brand-text/60 font-medium"
            >
              {experience.company}
            </motion.p>
          </div>
          <motion.div 
            layout
            layoutId={`icon-${experience.id}`}
            className="p-2 rounded-full border border-brand-secondary/60 text-brand-text/40 group-hover:text-brand-primary group-hover:border-brand-primary/40 transition-all"
          >
            <ArrowUpRight size={20} />
          </motion.div>
        </div>

        <motion.p 
          layout
          layoutId={`desc-${experience.id}`}
          className="text-brand-text/80 mb-8 max-w-2xl leading-relaxed"
        >
          {experience.description}
        </motion.p>

        <motion.div 
          layout
          layoutId={`tags-${experience.id}`}
          className="flex flex-wrap gap-2"
        >
          {experience.tags.map(tag => (
            <span 
              key={tag}
              className="px-3 py-1 bg-brand-secondary/40 text-brand-text/40 text-xs font-semibold rounded-full border border-brand-secondary/40"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.div 
          layoutId={`timeframe-${experience.id}`}
          className="absolute bottom-8 right-8 text-xs font-mono text-brand-text/20 hidden md:block"
        >
          {experience.timeframe}
        </motion.div>
      </div>
    </motion.div>
  );
}
