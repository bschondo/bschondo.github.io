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
  school: string;
  degree: string;
  timeframe: string;
  image: string;
}

export interface SkillGroup {
  category: string;
  skills: string[];
}
