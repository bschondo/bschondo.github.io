import { motion, AnimatePresence } from 'motion/react';
import { Experience } from '../types';
import { X, Calendar, Building2 } from 'lucide-react';
import { MDXProvider } from '@mdx-js/react';

interface ExperienceDetailProps {
  experience: Experience | null;
  onClose: () => void;
}

export default function ExperienceDetail({ experience, onClose }: ExperienceDetailProps) {
  if (!experience) return null;

  const MDXContent = experience.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Background Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-bg/60 backdrop-blur-md cursor-zoom-out"
      />

      {/* Content Container */}
      <motion.div
        layoutId={`card-${experience.id}`}
        className="relative w-full max-w-4xl max-h-[90vh] bg-brand-bg border border-brand-secondary rounded-3xl overflow-hidden shadow-2xl shadow-brand-bg/50 flex flex-col"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="relative p-6 md:p-10 border-b border-brand-secondary bg-brand-bg/50 backdrop-blur-sm z-10 flex flex-col md:flex-row gap-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-brand-bg/40 hover:bg-brand-secondary/50 transition-colors text-brand-text/60 z-20"
          >
            <X size={20} />
          </button>

          <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden border border-brand-secondary">
            <motion.img 
              layout
              layoutId={`image-${experience.id}`}
              src={experience.image}
              alt={experience.company}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 max-w-2xl">
            <motion.div 
              layout
              layoutId={`tags-${experience.id}`}
              className="flex flex-wrap gap-2 mb-4"
            >
              {experience.tags.map(tag => (
                <span 
                  key={tag}
                  className="px-2.5 py-1 bg-brand-secondary/40 text-brand-text/60 text-xs font-semibold rounded-full"
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            <motion.h2 
              layout
              layoutId={`title-${experience.id}`}
              className="text-3xl md:text-4xl font-bold text-brand-text mb-3 leading-tight"
            >
              {experience.title}
            </motion.h2>

            <motion.p 
              layout
              layoutId={`desc-${experience.id}`}
              className="text-base md:text-lg text-brand-text/80 mb-6 max-w-2xl leading-relaxed"
            >
              {experience.description}
            </motion.p>

            <div className="flex flex-wrap gap-4 md:gap-6 items-center text-brand-text/60 font-medium text-sm">
              <motion.div 
                layout
                layoutId={`company-${experience.id}`}
                className="flex items-center gap-2"
              >
                <Building2 size={16} className="text-brand-primary" />
                {experience.company}
              </motion.div>
              <motion.div 
                layout
                layoutId={`timeframe-${experience.id}`}
                className="flex items-center gap-2"
              >
                <Calendar size={16} className="text-brand-primary" />
                {experience.timeframe}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scrollable MDX Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.1 }}
          className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar"
        >
          <div className="max-w-2xl mx-auto markdown-body">
            <MDXProvider>
              <MDXContent />
            </MDXProvider>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
