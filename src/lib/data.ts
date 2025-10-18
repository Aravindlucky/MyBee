import type { Course, CaseStudySummary, Skill, Objective } from './types';

export const mockCourses: Course[] = [
  { id: '1', title: 'Corporate Finance', code: 'FINC-580', professor: 'Dr. Anya Sharma', term: 'Fall 2024' },
  { id: '2', title: 'Marketing Strategy', code: 'MKTG-550', professor: 'Dr. Ben Carter', term: 'Fall 2024' },
  { id: '3', title: 'Operations Management', code: 'OPNS-612', professor: 'Dr. Chloe Davis', term: 'Fall 2024' },
  { id: '4', title: 'Data Analytics', code: 'DECS-621', professor: 'Dr. Evan Foster', term: 'Spring 2025' },
];

export const mockCaseStudies: CaseStudySummary[] = [
    { id: 'cs1', title: "Netflix's International Expansion", subject: 'Global Strategy', lastUpdated: '2024-07-28' },
    { id: 'cs2', title: "Tesla's Competitive Advantage", subject: 'Automotive Industry', lastUpdated: '2024-07-25' },
];

export const mockSkills: Skill[] = [
    { id: 'sk1', name: 'Financial Modeling', type: 'Hard', confidence: 3, notes: 'Practice DCF models.' },
    { id: 'sk2', name: 'Data Analysis (SQL)', type: 'Hard', confidence: 2, notes: 'Take an online course.' },
    { id: 'sk3', name: 'Public Speaking', type: 'Soft', confidence: 4, notes: 'Join the public speaking club.' },
    { id: 'sk4', name: 'Negotiation', type: 'Soft', confidence: 3, notes: 'Read "Never Split the Difference".' },
    { id: 'sk5', name: 'Leadership', type: 'Soft', confidence: 4, notes: 'Lead a project in the Tech Club.' },
];

export const mockObjectives: Objective[] = [
    {
        id: 'obj1',
        title: 'Become a top candidate for Product Management roles.',
        semester: 'Fall 2024',
        keyResults: [
            { id: 'kr1-1', description: 'Complete a side project building a simple app.', isCompleted: false },
            { id: 'kr1-2', description: 'Secure leadership position in the Tech Club.', isCompleted: true },
            { id: 'kr1-3', description: 'Conduct 15 informational interviews with PMs.', isCompleted: false },
        ]
    },
    {
        id: 'obj2',
        title: 'Improve quantitative analysis skills.',
        semester: 'Spring 2025',
        keyResults: [
            { id: 'kr2-1', description: 'Achieve an A in Data Analytics course.', isCompleted: false },
            { id: 'kr2-2', description: 'Complete a personal project using Python for data analysis.', isCompleted: false },
        ]
    }
];

export const mockJournalEntries = [
  { id: 'je1', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), content: 'Today we discussed Porter\'s Five Forces in strategy class. It was interesting to apply it to the airline industry. Need to review the concept of "supplier power" more thoroughly.' },
  { id: 'je2', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), content: 'Had an informational interview with a PM at Google. She emphasized the importance of user empathy and storytelling. It was incredibly insightful. I should focus on developing these soft skills.' },
];
