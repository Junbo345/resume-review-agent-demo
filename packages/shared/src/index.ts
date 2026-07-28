import { z } from 'zod';

export const criteria = [
  { key:'programming', label:'Programming fundamentals', description:'TypeScript or Python fluency and maintainable implementation habits.', weight:20, maximumScore:5, required:true, guide:'5 = multiple concrete projects; 3 = some hands-on work; 1 = adjacent exposure.' },
  { key:'backend', label:'Backend & API development', description:'REST API design, integration, and service-side development.', weight:15, maximumScore:5, required:true, guide:'5 = shipped APIs; 3 = coursework or small services; 1 = indirect exposure.' },
  { key:'sql', label:'SQL & data handling', description:'Relational databases, queries, schemas, and reliable data flows.', weight:15, maximumScore:5, required:true, guide:'5 = designed and queried production-like data; 3 = practical projects; 1 = basic familiarity.' },
  { key:'llm', label:'AI / LLM integration', description:'Responsible use of language-model APIs and structured outputs.', weight:15, maximumScore:5, required:false, guide:'5 = integrated an LLM feature; 3 = meaningful project; 1 = documented exploration.' },
  { key:'automation', label:'Automation & workflows', description:'Automation, orchestration, and repeatable workflow design.', weight:15, maximumScore:5, required:false, guide:'5 = automated multi-step processes; 3 = scripts or tools; 1 = awareness.' },
  { key:'quality', label:'Testing & software quality', description:'Testing, debugging, code review, and quality practices.', weight:10, maximumScore:5, required:true, guide:'5 = strong test and review evidence; 3 = regular testing; 1 = limited evidence.' },
  { key:'communication', label:'Technical communication', description:'Clear documentation, collaboration, and explanation of technical work.', weight:10, maximumScore:5, required:false, guide:'5 = strong docs and stakeholder communication; 3 = clear project notes; 1 = limited evidence.' },
] as const;

export const job = { id:'job-ai-automation-intern', title:'AI Automation Engineer Intern', status:'Open', rubricVersion:'v1.0', description:'Join a small product engineering team building dependable internal automations. You will turn ambiguous workflows into tested services, connect REST APIs and relational data, and experiment responsibly with LLM features. Strong written communication and a learning mindset matter as much as syntax.', responsibilities:['Build small services in TypeScript or Python','Design REST API integrations and SQL data flows','Prototype structured LLM API features with safeguards','Automate repeatable business workflows','Write tests, debug issues, and participate in code review','Document decisions so teammates can operate what you build'] };

export const Evidence = z.object({ text:z.string().min(1), section:z.string().nullable(), page:z.number().nullable() });
export const CriterionResult = z.object({ criterionKey:z.string(), score:z.number().min(0).max(5), confidence:z.number().min(0).max(1), rationale:z.string(), evidence:z.array(Evidence), missingInformation:z.array(z.string()) });
export const ReviewOutput = z.object({ summary:z.string(), criteria:z.array(CriterionResult), concerns:z.array(z.object({type:z.enum(['insufficient_evidence','inconsistent_dates','unclear_claim','prompt_injection','manual_verification_required']),description:z.string()})), suggestedInterviewQuestions:z.array(z.string()), requiresHumanReview:z.literal(true) });
export type ReviewOutput = z.infer<typeof ReviewOutput>;
export type Resume = { id:string; displayCode:string; title:string; fit:string; text:string; promptInjection?:boolean };
export type Review = ReviewOutput & { id:string; candidateId:string; displayCode:string; provider:string; model:string; status:'completed'|'failed'; overallScore:number; evidenceBand:string; rubricVersion:string; promptVersion:string; createdAt:string; humanReview?:{ outcome:string; notes:string } };
export const humanOutcomes = ['Continue review','Request more information','Invite to interview','Hold','Close review'] as const;

export function calculateOverallScore(results: Pick<z.infer<typeof CriterionResult>,'criterionKey'|'score'>[]) { return Math.round(results.reduce((total, result) => { const c=criteria.find(x=>x.key===result.criterionKey); return total+(c ? result.score/c.maximumScore*c.weight : 0); },0)*10)/10; }
export function evidenceBand(score:number) { return score>=80?'Strong evidence':score>=60?'Moderate evidence':score>0?'Limited evidence':'Insufficient evidence'; }
export function validateEvidence(output:ReviewOutput, source:string) { for (const c of output.criteria) for (const e of c.evidence) if (!source.includes(e.text)) throw new Error(`Evidence validation failed for ${c.criterionKey}: quotation not found`); return true; }
