import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

interface InfoCardProps {
  id: string;
  title: string;
  subtitle: string;
  timeframe: string;
  description: string;
  tags?: string[];
  image: string;
  alt: string;
  onSelect: () => void;
}

export default function InfoCard({
  id,
  title,
  subtitle,
  timeframe,
  description,
  tags = [],
  image,
  alt,
  onSelect,
}: InfoCardProps) {
  return (
    <motion.div
      layoutId={`card-${id}`}
      onClick={onSelect}
      className="group relative bg-brand-secondary/20 border border-brand-secondary/40 rounded-2xl cursor-pointer hover:bg-brand-secondary/30 hover:border-brand-primary/40 transition-colors duration-300 overflow-hidden flex flex-col md:flex-row"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="w-full md:w-72 h-72 overflow-hidden">
        <motion.img
          layout
          layoutId={`image-${id}`}
          src={image}
          alt={alt}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100"
          referrerPolicy="no-referrer"
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex-1 p-8 md:p-10 relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <motion.h3
              layout
              layoutId={`title-${id}`}
              className="text-2xl font-bold text-brand-text mb-1 group-hover:text-brand-primary transition-colors"
            >
              {title}
            </motion.h3>
            <motion.p
              layout
              layoutId={`subtitle-${id}`}
              className="text-brand-text/60 font-medium"
            >
              {subtitle}
            </motion.p>
          </div>
          <motion.div
            layout
            className="p-2 rounded-full border border-brand-secondary/60 text-brand-text/40 group-hover:text-brand-primary group-hover:border-brand-primary/40 transition-all"
          >
            <ArrowUpRight size={20} />
          </motion.div>
        </div>

        <motion.p
          layout
          layoutId={`description-${id}`}
          className="text-brand-text/80 mb-8 w-full leading-relaxed"
        >
          {description}
        </motion.p>

        <motion.div
          layout
          layoutId={`tags-${id}`}
          className="flex flex-wrap gap-2"
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-brand-secondary/40 text-brand-text/40 text-xs font-semibold rounded-full border border-brand-secondary/40"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.div
          layoutId={`timeframe-${id}`}
          className="absolute bottom-8 right-8 text-xs font-mono text-brand-text/20 hidden md:block"
        >
          {timeframe}
        </motion.div>
      </div>
    </motion.div>
  );
}
