import { Experience, Education, SkillGroup } from './types';
import AmazonRoboticsMDX from './data/experiences/amazon-robotics.mdx';
import LeadUXMDX from './data/experiences/lead-ux.mdx';

export const EXPERIENCES: Experience[] = [
  {
    id: 'amazon',
    title: 'Software Development Engineer I - II',
    company: 'Amazon Robotics',
    timeframe: '2022 - Present',
    description: 'Building scalable path planning and navigation systems for autonomous robots operating alongside human workers in Amazon fulfillment centers.',
    tags: ['Robotics', 'Path Planning', 'AWS', 'Java', 'Typescript'],
    image: 'resources/AmazonRobotics.jpg',
    content: AmazonRoboticsMDX
  }
];

export const EDUCATION: Education[] = [
  {
    id: 'umich',
    school: 'University of Michigan',
    degree: "B.S. in Computer Science, College of Engineering",
    timeframe: '2018 - 2021',
    location: 'Ann Arbor, MI',
    tags: ['Marching Band', 'Michigan Hackers', 'Engineering'],
    gpa: '3.6', 
    image: 'resources/UMichBigHouse.jpg',
    summary: 'I completed my bachelor\'s degree in computer science through the College of Engineering and graduated in December 2021. I was involved with <a class="text_link" href="https://michhackers.com/">Michigan Hackers</a> on the android development and cybersecurity team to improve my programming outside of class. In addition, I minored in music and was a member of the <a class="text_link" href="https://michiganmarchingband.com/">Michigan Marching Band</a>. The computer science upper-level electives I took include Computer Security, Web Systems, Operating Systems, and Software Engineering.',
    classInfo: [
      {
        timeRange: '2018-2019',
        semesters: [
          {
            name: 'Fall 2018',
            classes: [
              'Self-Driving Cars, Drones, and Beyond: An Intro to Autonomous Electronic Systems (ENGR 100)',
              'Differential Equations (Math 216)',
              'General Physics I (PHYSICS 140)',
              'Campus Band (ENS 346)',
              'Marching Band (ENS 348)'
            ]
          },
          {
            name: 'Winter 2019',
            classes: [
              'Introduction to Computer and Programming (ENGR 101)',
              'General Chemistry (CHEM 130)',
              'Discrete Mathematics (EECS 203)',
              'The History of the Arab-Israeli Conflict (HISTORY 244)',
              'Entrepreneurship Hour (ENTR 407)'
            ]
          }
        ]
      },
      {
        timeRange: '2019-2020',
        semesters: [
          {
            name: 'Fall 2019',
            classes: [
              'Programming and Intro Data Structures (EECS 280)',
              'Entrepreneurship Hour (ENTR 407)',
              'General Physics II (PHYSICS 240)',
              'Introduction to Statistics and Data Analysis (STATS 250)',
              'Marching Band (ENS 348)'
            ]
          },
          {
            name: 'Winter 2020 (Partially Virtual)',
            classes: [
              'Data Structures and Algorithms (EECS 281)',
              'Introduction to Computer Organization (EECS 370)',
              'Technical Communications (TCHNCLCM 300)',
              'History of Music (MUSICOL 346)',
              'Campus Band (ENS 346)'
            ]
          }
        ]
      },
      {
        timeRange: '2020-2021',
        semesters: [
          {
            name: 'Fall 2020 (Virtual)',
            classes: [
              'Foundations of Computer Science (EECS 376)',
              'Introduction to Computer Security (EECS 388)',
              'Web Systems (EECS 485)',
              'Linear Algebra (MATH 214)'
            ]
          },
          {
            name: 'Winter 2021 (Virtual)',
            classes: [
              'Software Engineering (EECS 481)',
              'Introduction to Operating Systems (EECS 482)',
              'Introduction to Statistical Computing (STATS 306)',
              'Contemporary Moral Problems (PHIL 355)'
            ]
          }
        ]
      },
      {
        timeRange: '2021-Graduation',
        semesters: [
          {
            name: 'Fall 2021',
            classes: [
              'Human-Centered Software and Design and Development (EECS 497)',
              'Major Design Experience Professionalism (EECS 496)',
              'Advanced Technical Communication for Computer Science (TCHNCLCM 497)',
              'Intro to Music Theory (THEORY 137)',
              'Naked Eye Astronomy (ASTRO 127)',
              'Marching Band (ENS 348)',
              'Campus Band (ENS 346)'
            ]
          }
        ]
      }
    ]
  }
];

export const SKILL_GROUPS: SkillGroup[] = [
  {
    category: 'Languages',
    skills: ['Java', 'TypeScript', 'Python', 'C++', 'SQL']
  },
  {
    category: 'Frameworks & Tools',
    skills: ['REST APIs', 'Java Topology Suit (JTS)', 'Linux', 'Docker', 'Redis', 'ROS2', 'React', 'Git'] 
  },
  {
    category: 'AWS Services',
    skills: ['API Gateway', 'CloudFormation', 'CloudWatch', 'DynamoDB', 'ECS', 'Kinesis', 'Lambda', 'S3', 'SNS', 'SQS']
  }
];

export const INTERESTS: SkillGroup[] = [
  {
    category: 'Activities',
    skills: [
      'Volleyball',
      'Rock Climbing',
      'Reading (Historical Fiction)',
      'Softball',
    ]
  },
  {
    category: 'Games',
    skills: [
      'PC Gaming (Strategy, Roguelike)',
      'Board Games',
      'Chess',
    ]
  }
];
