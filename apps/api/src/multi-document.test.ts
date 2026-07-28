import { describe, expect, it } from 'vitest';
import { extractCandidateData } from './candidate-extraction';
import { CandidateFitOutput, normalizeExtractedText } from '@rr/shared';

describe('multi-document workflow',()=>{
  it('normalizes common PDF extraction artifacts',()=>expect(normalizeExtractedText('ArƟficial  Intelligence\nSoŌware')).toBe('Artificial  Intelligence\nSoftware'));
  it('extracts structured candidate facts without inventing fields',()=>{const result=extractCandidateData('Ada Lovelace\nada@example.com\nSKILLS\nPython, SQL');expect(result.candidate_name).toBe('Ada Lovelace');expect(result.email).toBe('ada@example.com');expect(result.skills).toContain('Python');expect(result.experience).toEqual([]);});
  it('extracts sectioned education, experience, and projects from PDF-style text',()=>{
    const result=extractCandidateData(`Junbo Li\nContact & Location: j2959li@uwaterloo.ca | +1 (437) 684-3319 | Waterloo, ON, Canada\nEDUCATION\nUniversity of Waterloo Waterloo, ON | 09/2025 - 06/2027 (Expected)\nMaster of Data Science and Artificial Intelligence (CO-OP)\n• Related coursework: Deep Learning, Data Engineering (Spark)\nSKILLS\n• Data Analytics & BI: Python, SQL, Pandas, NumPy\nPROFESSIONAL EXPERIENCE\nDream Technology Inc. San Francisco, CA | 05/2026 - 07/2026\nAI & Algorithms Engineering Assistant | Machine Learning\n• Built an end-to-end AI workflow.\nPROJECTS\nExploring Determinants of Child Mortality — Global Data Analysis Project 09/2024 - 12/2024\nResearch Project | R, SQL, Git\n• Built a Bayesian regression pipeline.`);
    expect(result.education[0]).toMatchObject({institution:'University of Waterloo',degree:'Master of Data Science and Artificial Intelligence (CO-OP)',start_date:'09/2025',end_date:'06/2027'});
    expect(result.education[0].details[0]).toContain('Deep Learning');
    expect(result.experience[0]).toMatchObject({company:'Dream Technology Inc.',location:'San Francisco, CA',title:'AI & Algorithms Engineering Assistant'});
    expect(result.experience[0].details[0]).toContain('end-to-end AI workflow');
    expect(result.projects[0]).toMatchObject({name:'Exploring Determinants of Child Mortality',technologies:['R','SQL','Git']});
  });
  it('validates fit output shape',()=>expect(CandidateFitOutput.parse({job_summary:{job_title:null,required_skills:[],preferred_skills:[],key_responsibilities:[],education_requirements:[]},candidate_results:[],ranking:[]}).ranking).toEqual([]));
});
