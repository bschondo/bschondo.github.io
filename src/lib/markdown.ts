import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export function getResumeData() {
  const filePath = path.join(process.cwd(), 'content/resume.md');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return matter(fileContent);
}