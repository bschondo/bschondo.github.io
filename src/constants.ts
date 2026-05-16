import { Experience, Education, SkillGroup } from './types';
import AmazonRoboticsMDX from './data/experiences/amazon-robotics.mdx';
import LeadUXMDX from './data/experiences/lead-ux.mdx';

export const EXPERIENCES: Experience[] = [
  {
    id: 'amazon',
    title: 'Software Developer',
    company: 'Amazon Robotics',
    timeframe: '2022 - Present',
    description: 'Developing high-scale path planning algorithms for autonomous mobile robots in global fulfillment centers.',
    tags: ['Algorithms', 'Java', 'Robotics', 'Path Planning'],
    image: 'https://picsum.photos/seed/amazon/800/450',
    content: AmazonRoboticsMDX
  },
  {
    id: 'oasis',
    title: 'Lead UX Developer',
    company: 'Oasis Design',
    timeframe: '2019 - 2022',
    description: 'Refined the intersection of AI-driven interfaces and traditional human-centered design.',
    tags: ['Framer Motion', 'Interaction Design', 'Vue', 'Design Ops'],
    image: 'https://picsum.photos/seed/oasis/800/450',
    content: LeadUXMDX
  }
];

export const EDUCATION: Education[] = [
  {
    school: 'Stanford University',
    degree: 'B.S. in Computer Science',
    timeframe: '2015 - 2019',
    image: 'https://picsum.photos/seed/stanford/800/450'
  }
];

export const SKILL_GROUPS: SkillGroup[] = [
  {
    category: 'Engineering',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Vite', 'MDX']
  },
  {
    category: 'Design',
    skills: ['Product Design', 'Framer Motion', 'Design Systems', 'UX Research']
  }
];
