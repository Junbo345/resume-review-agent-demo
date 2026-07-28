import { CandidateStructuredData } from '@rr/shared';

const empty = (): CandidateStructuredData => ({
  candidate_name: null, email: null, phone: null, location: null, summary: null,
  skills: [], education: [], experience: [], projects: [], certifications: [], additional_information: [],
});

const bullet = (line: string) => /^[-•●▪◦\uF0B7]/.test(line.trim());
const stripBullet = (line: string) => line.trim().replace(/^[-•●▪◦\uF0B7]\s*/, '');
const isHeader = (line: string) => /^(education|skills?|professional experience|work experience|experience|projects?|certifications?|summary|additional information)$/i.test(line.trim());
const datePattern = /\b(\d{1,2}\/\d{4}|\d{4})\s*[–—-]\s*(\d{1,2}\/\d{4}|\d{4}|present|current|expected)\b/i;

function sections(lines: string[]) {
  const found: Record<string, string[]> = {};
  let current = 'additional_information';
  for (const line of lines) {
    const header = line.trim().toLowerCase();
    if (isHeader(line)) {
      current = header.startsWith('skill') ? 'skills' : header.startsWith('educ') ? 'education' : header.includes('experience') ? 'experience' : header.startsWith('project') ? 'projects' : header.startsWith('cert') ? 'certifications' : header === 'summary' ? 'summary' : 'additional_information';
      found[current] ||= [];
      continue;
    }
    (found[current] ||= []).push(line);
  }
  return found;
}

function mergeWrappedBullets(lines: string[]) {
  const result: string[] = [];
  for (const line of lines) {
    if (bullet(line) || !result.length) result.push(line.trim());
    else result[result.length - 1] += ` ${line.trim()}`;
  }
  return result;
}

function parseSkills(lines: string[]) {
  return mergeWrappedBullets(lines).flatMap(line => {
    const value = stripBullet(line).replace(/^[^:]+:\s*/, '');
    return value.split(/,\s*/).map(item => item.trim()).filter(Boolean);
  });
}

function splitDate(line: string) {
  const match = line.match(datePattern);
  if (!match || match.index === undefined) return { before: line.trim(), start: null, end: null };
  const prefix = line.slice(0, match.index).trim().replace(/[|–—-]+\s*$/, '').trim();
  return { before: prefix, start: match[1], end: match[2] };
}

function organizationAndLocation(value: string) {
  const match = value.match(/^(.+?)\s+((?:San Francisco|New York|Los Angeles|Toronto|Waterloo|Boston|Chicago|Seattle|Vancouver|Montreal|Ottawa),\s*(?:ON|BC|AB|QC|CA|NY|MA|IL|WA|USA|Canada))$/i);
  return match ? { organization: match[1].trim(), location: match[2].trim() } : { organization: value.trim(), location: null };
}

function parseEducation(lines: string[]) {
  const output: CandidateStructuredData['education'] = [];
  for (let i = 0; i < lines.length;) {
    if (bullet(lines[i]) || !datePattern.test(lines[i])) { i++; continue; }
    const header = splitDate(lines[i]);
    const institution = organizationAndLocation(header.before).organization;
    const degree = lines[i + 1] && !bullet(lines[i + 1]) ? lines[i + 1].trim() : null;
    const details: string[] = [];
    i += degree ? 2 : 1;
    while (i < lines.length && !datePattern.test(lines[i])) { if (bullet(lines[i])) details.push(stripBullet(lines[i])); else if (details.length) details[details.length - 1] += ` ${lines[i].trim()}`; i++; }
    output.push({ institution: institution || null, degree, field_of_study: null, start_date: header.start, end_date: header.end, details });
  }
  return output;
}

function parseExperience(lines: string[]) {
  const output: CandidateStructuredData['experience'] = [];
  for (let i = 0; i < lines.length;) {
    if (bullet(lines[i]) || !datePattern.test(lines[i])) { i++; continue; }
    const header = splitDate(lines[i]);
    const organization = organizationAndLocation(header.before);
    const company = organization.organization;
    const location = organization.location;
    const title = lines[i + 1] && !bullet(lines[i + 1]) ? lines[i + 1].split('|')[0].trim() : null;
    const details: string[] = [];
    i += title ? 2 : 1;
    while (i < lines.length && !datePattern.test(lines[i])) { if (bullet(lines[i])) details.push(stripBullet(lines[i])); else if (details.length) details[details.length - 1] += ` ${lines[i].trim()}`; i++; }
    output.push({ company: company || null, title, location, start_date: header.start, end_date: header.end, details });
  }
  return output;
}

function parseProjects(lines: string[]) {
  const output: CandidateStructuredData['projects'] = [];
  for (let i = 0; i < lines.length;) {
    if (bullet(lines[i]) || !datePattern.test(lines[i])) { i++; continue; }
    const header = splitDate(lines[i]);
    const name = header.before.split(/[—–]/)[0].replace(/\s*[|-]\s*$/, '').trim();
    const techLine = lines[i + 1] && !bullet(lines[i + 1]) ? lines[i + 1] : '';
    const technologies = techLine.includes('|') ? techLine.split('|').at(-1)!.split(/,\s*/).map(x => x.trim()).filter(Boolean) : [];
    const details: string[] = [];
    i += techLine ? 2 : 1;
    while (i < lines.length && !datePattern.test(lines[i])) { if (bullet(lines[i])) details.push(stripBullet(lines[i])); else if (details.length) details[details.length - 1] += ` ${lines[i].trim()}`; i++; }
    output.push({ name: name || null, technologies, details });
  }
  return output;
}

export function extractCandidateData(text: string): CandidateStructuredData {
  const out = empty();
  const lines = text.normalize('NFKC').split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const grouped = sections(lines);
  out.candidate_name = lines.find(line => /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(line)) || null;
  out.email = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || null;
  out.phone = text.match(/(?:\+?\d[\d ()-]{7,}\d)/)?.[0] || null;
  const contact = lines.find(line => /contact\s*&?\s*location/i.test(line));
  out.location = contact?.split('|').at(-1)?.trim() || lines.find(line => /\b(ON|Ontario|Toronto|Waterloo|Canada|CA|NY|USA)\b/i.test(line)) || null;
  const summaryLines = grouped.summary || [];
  out.summary = summaryLines.filter(line => !isHeader(line)).join(' ') || null;
  out.skills = parseSkills(grouped.skills || []);
  out.education = parseEducation(grouped.education || []);
  out.experience = parseExperience(grouped.experience || []);
  out.projects = parseProjects(grouped.projects || []);
  out.certifications = (grouped.certifications || []).filter(line => !bullet(line)).map(line => stripBullet(line));
  out.additional_information = mergeWrappedBullets(grouped.additional_information || []).filter(line => bullet(line)).map(stripBullet);
  return CandidateStructuredData.parse(out);
}
