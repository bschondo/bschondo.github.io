import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Briefcase, GraduationCap, Code2, Github, Linkedin, Mail, FileText } from 'lucide-react';
import { Experience, Education } from './types';
import { EXPERIENCES, EDUCATION, SKILL_GROUPS, INTERESTS } from './constants';
import ExperienceCard from './components/ExperienceCard';
import ExperienceDetail from './components/ExperienceDetail';
import EducationCard from './components/EducationCard';
import EducationDetail from './components/EducationDetail';

export default function App() {
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
  const [showResume, setShowResume] = useState(false);

  // Prevent body scroll when Focus Mode is active
  useEffect(() => {
    if (selectedExperience || selectedEducation) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedExperience, selectedEducation]);

  // Preload PDF on component mount
  useEffect(() => {
    const iframe = document.createElement('iframe');
    iframe.src = './resources/BenSchondorfResume2026.pdf';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    return () => {
      document.body.removeChild(iframe);
    };
  }, []);

  return (
    <div className="min-h-screen selection:bg-brand-primary selection:text-brand-bg">
      {/* Navigation / Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-brand-bg/80 backdrop-blur-sm border-b border-brand-secondary/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="text-lg font-bold tracking-tighter text-brand-text">
            BENJAMIN <span className="text-brand-primary">SCHONDORF</span>
          </div>
          <nav className="flex gap-6 md:gap-8 text-sm font-medium text-brand-text/60">
            <a href="#about" className="hover:text-brand-primary transition-colors">About</a>
            <a href="#experience" className="hover:text-brand-primary transition-colors">Experience</a>
            <a href="#education" className="hover:text-brand-primary transition-colors">Education</a>
            <a href="#skills" className="hover:text-brand-primary transition-colors">Skills</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-32">
        {/* ... Hero Section ... */}
        <section id="about" className="mb-8 scroll-mt-32">
          {/* Hero content remains same */}
          <div className="flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left">
            <div className="relative group">
              <div className="absolute -inset-1 bg-brand-primary/20 rounded-3xl blur-xl group-hover:bg-brand-primary/30 transition-all duration-500 opacity-70" />
              <img
                src="./resources/headshot.jpeg"
                alt="Heading Image"
                className="relative w-48 h-48 md:w-64 md:h-64 object-cover rounded-3xl border-2 border-brand-secondary"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1">
              {/* <span className="inline-block px-3 py-1 bg-brand-primary/10 text-brand-primary text-sm font-bold rounded-full mb-6">
                Available for new collaborations
              </span> */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-brand-text mb-6">
                Building software systems for <span className="text-brand-primary italic">reliability</span> and <span className="text-brand-accent">scalability</span>
              </h1>
              {/* <p className="text-xl text-brand-text/60 max-w-2xl leading-relaxed mb-8"></p> */}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                <button 
                  onClick={() => setShowResume(!showResume)}
                  className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all group ${
                    showResume 
                      ? 'bg-brand-accent text-white hover:bg-brand-accent/90' 
                      : 'bg-brand-primary text-brand-bg hover:bg-brand-primary/90'
                  }`}
                >
                  <FileText size={20} className="group-hover:rotate-12 transition-transform" />
                  {showResume ? 'Hide Resume' : 'View Resume PDF'}
                </button>
                
                <div className="flex gap-4">
                  {/* <a href="#" className="p-3 bg-brand-secondary/40 text-brand-text hover:text-brand-primary border border-brand-secondary hover:border-brand-primary/40 rounded-xl transition-all">
                    <Github size={24} />
                  </a> */}
                  <a href="https://www.linkedin.com/in/benjamin-schondorf/" className="p-3 bg-brand-secondary/40 text-brand-text hover:text-brand-primary border border-brand-secondary hover:border-brand-primary/40 rounded-xl transition-all">
                    <Linkedin size={24} />
                  </a>
                  <a href="mailto:benschondorf@gmail.com" className="p-3 bg-brand-secondary/40 text-brand-text hover:text-brand-primary border border-brand-secondary hover:border-brand-primary/40 rounded-xl transition-all">
                    <Mail size={24} />
                  </a>
                </div>
              </div>

              <AnimatePresence>
                {showResume && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginBottom: '2rem' }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    className="overflow-hidden border border-brand-secondary rounded-2xl bg-brand-secondary/5"
                  >
                    <div className="p-4 bg-brand-secondary/20 flex justify-between items-center border-b border-brand-secondary">
                      <span className="text-xs font-mono text-brand-text/40">BenSchondorfResume2026.PDF</span>
                      <a 
                        href="./resources/BenSchondorfResume2026.pdf"  
                        download 
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:underline"
                      >
                        Download Original
                      </a>
                    </div>
                    <div className="aspect-[1/1.41] w-full">
                      <iframe 
                        src="./resources/BenSchondorfResume2026.pdf#toolbar=0&navpanes=0&scrollbar=1"
                        className="w-full h-full"
                        title="Ben Schondorf Resume"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Experience Grid */}
        <section id="experience" className="mb-24 scroll-mt-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <Briefcase size={24} />
            </div>
            <h2 className="text-3xl font-bold text-brand-text">Experience</h2>
            <div className="flex-1 h-px bg-brand-secondary/50 ml-4" />
          </div>
          
          <div className="flex flex-col gap-8">
            {EXPERIENCES.map((exp) => (
              <ExperienceCard 
                key={exp.id} 
                experience={exp} 
                onSelect={setSelectedExperience} 
              />
            ))}
          </div>
        </section>

        {/* Education */}
        <section id="education" className="mb-24 scroll-mt-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-2 bg-brand-accent/10 text-brand-accent rounded-lg">
              <GraduationCap size={24} />
            </div>
            <h2 className="text-3xl font-bold text-brand-text">Education</h2>
            <div className="flex-1 h-px bg-brand-secondary/50 ml-4" />
          </div>
          <div className="flex flex-col gap-8 max-w-6xl">
            {EDUCATION.map((edu) => (
              <EducationCard key={edu.id} education={edu} onSelect={setSelectedEducation} />
            ))}
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="mb-24 scroll-mt-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <Code2 size={24} />
            </div>
            <h2 className="text-3xl font-bold text-brand-text">Skills</h2>
            <div className="flex-1 h-px bg-brand-secondary/50 ml-4" />
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {SKILL_GROUPS.map((group, index) => (
              <div key={index} className="p-8 bg-brand-secondary/10 border border-brand-secondary/30 rounded-2xl">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary mb-6 font-mono">
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {group.skills.map(skill => (
                    <span 
                      key={skill}
                      className="px-4 py-2 bg-brand-secondary/20 border border-brand-secondary/50 text-brand-text/70 text-sm font-medium rounded-xl hover:border-brand-primary/40 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interests */}
        <section id="interests" className="mb-24 scroll-mt-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-2 bg-brand-primary/10 text-brand-accent rounded-lg">
              <Dices size={24} />
            </div>
            <h2 className="text-3xl font-bold text-brand-text">Interests</h2>
            <div className="flex-1 h-px bg-brand-secondary/50 ml-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {INTERESTS.map((group, index) => (
              <div key={index} className="p-8 bg-brand-secondary/10 border border-brand-secondary/30 rounded-2xl">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary mb-6 font-mono">
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {group.skills.map(skill => (
                    <span 
                      key={skill}
                      className="px-4 py-2 bg-brand-secondary/20 border border-brand-secondary/50 text-brand-text/70 text-sm font-medium rounded-xl hover:border-brand-primary/40 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Focus Mode Portal */}
      <AnimatePresence>
        {selectedExperience && (
          <ExperienceDetail 
            experience={selectedExperience} 
            onClose={() => setSelectedExperience(null)} 
          />
        )}
        {selectedEducation && (
          <EducationDetail 
            education={selectedEducation}
            onClose={() => setSelectedEducation(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
