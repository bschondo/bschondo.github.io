import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Education } from '../types';
import { X, Calendar, MapPin, Award, ChevronRight } from 'lucide-react';
import SemesterCard from './SemesterCard';

interface EducationDetailProps {
  education: Education | null;
  onClose: () => void;
}

export default function EducationDetail({ education, onClose }: EducationDetailProps) {
  if (!education) return null;

  const [openYear, setOpenYear] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-bg/70 backdrop-blur-md cursor-zoom-out"
      />

      <motion.div
        layoutId={`card-${education.id}`}
        className="relative w-full max-w-6xl max-h-[90vh] bg-brand-bg border border-brand-secondary rounded-3xl overflow-hidden shadow-2xl shadow-brand-bg/50 flex flex-col"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="relative p-6 md:p-10 border-b border-brand-secondary bg-brand-bg/50 backdrop-blur-sm z-10 flex flex-col md:flex-row gap-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-brand-bg/40 hover:bg-brand-secondary/50 transition-colors text-brand-text/60 z-20"
          >
            <X size={20} />
          </button>

          <div className="w-full md:w-72 h-72 rounded-3xl overflow-hidden border border-brand-secondary">
            <motion.img
              layout
              layoutId={`image-${education.id}`}
              src={education.image}
              alt={education.school}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 min-w-0">
            <motion.h2
              layout
              layoutId={`title-${education.id}`}
              className="text-3xl md:text-4xl font-bold text-brand-text mb-3 leading-tight"
            >
              {education.school}
            </motion.h2>
            <motion.p className="text-brand-text/80 text-lg mb-4 leading-relaxed">
              {education.degree}
            </motion.p>
            <div className="grid gap-3 text-brand-text/60 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-primary" />
                {education.timeframe}
              </div>
              {education.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-primary" />
                  {education.location}
                </div>
              )}
              {education.gpa && (
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-brand-primary" />
                  GPA: {education.gpa}
                </div>
              )}
            </div>
            {education.tags && education.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {education.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-brand-secondary/40 text-brand-text/60 text-xs font-semibold rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.1 }}
          className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar"
        >
          <div className="w-full mx-auto space-y-10 text-brand-text/80 leading-relaxed">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-brand-text">Overview</h3>
              {education.summary ? (
                <p
                  className="prose prose-invert max-w-full text-brand-text/80 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: education.summary }}
                />
              ) : (
                <p className="prose prose-invert max-w-full text-brand-text/80 leading-relaxed">
                  No summary available.
                </p>
              )}
            </div>

            <div className="space-y-6">
              {education.classInfo?.map((year) => {
                const isOpen = openYear === year.timeRange;
                return (
                  <div key={year.timeRange} className="rounded-2xl border border-brand-secondary/30 bg-brand-secondary/10 overflow-hidden">
                    <button
                      onClick={() => setOpenYear(isOpen ? null : year.timeRange)}
                      className="group w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 text-left"
                    >
                      <h3 className="text-lg md:text-xl font-bold text-brand-text">{year.timeRange}</h3>
                      <motion.div
                        initial={false}
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        whileHover={{ rotate: isOpen ? 100 : 10 }}
                        className="text-brand-text/60 group-hover:text-brand-primary"
                      >
                        <ChevronRight size={18} />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ scaleY: 0, opacity: 0 }}
                          animate={{ scaleY: 1, opacity: 1 }}
                          exit={{ scaleY: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                          style={{ transformOrigin: 'top' }}
                          className="px-4 md:px-6 py-4 md:py-6"
                        >
                          <div className="grid gap-6 md:grid-cols-2">
                            {year.semesters.map((semester) => (
                              <SemesterCard key={semester.name} semester={semester} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
