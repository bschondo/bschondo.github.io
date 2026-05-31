export interface Experience {
  id: string;
  title: string;
  company: string;
  timeframe: string;
  description: string;
  tags: string[];
  image: string;
  content: any; // The MDX component
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  timeframe: string;
  image: string;
  location?: string;
  tags?: string[];
  gpa?: string;
  summary?: string;
  classInfo?: {
    timeRange: string;
    semesters: {
      name: string;
      classes: string[];
    }[];
  }[];
}

export interface SkillGroup {
  category: string;
  skills: string[];
}
