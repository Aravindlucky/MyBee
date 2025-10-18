import type { Course, CaseStudySummary, Skill, Objective, AttendanceRecord, JournalEntry, ClassType } from './types';

export const mockCourses: Course[] = [
  { id: '1', title: 'Supply Chain Management', code: 'OPNS-612', professor: 'Dr. Chloe Davis', term: 'Fall 2024' },
  { id: '2', title: 'Corporate Finance', code: 'FINC-580', professor: 'Dr. Anya Sharma', term: 'Fall 2024' },
  { id: '3', title: 'Marketing Strategy', code: 'MKTG-550', professor: 'Dr. Ben Carter', term: 'Fall 2024' },
];

export const mockScheduledSessions: { courseId: string, date: string, classType: ClassType }[] = [
    // SCM
    { courseId: '1', date: '2024-09-22', classType: 'Lecture' },
    { courseId: '1', date: '2024-09-23', classType: 'Lecture' },
    { courseId: '1', date: '2024-09-29', classType: 'Lecture' },
    { courseId: '1', date: '2024-09-30', classType: 'Lecture' },
    { courseId: '1', date: '2024-10-06', classType: 'Lecture' },
    { courseId: '1', date: '2024-10-07', classType: 'Lecture' },
    { courseId: '1', date: '2024-10-13', classType: 'Lecture' },
    { courseId: '1', date: '2024-10-14', classType: 'Lecture' },

    // Finance
    { courseId: '2', date: '2024-09-22', classType: 'Lecture' },
    { courseId: '2', date: '2024-09-24', classType: 'Lecture' },
    { courseId: '2', date: '2024-09-29', classType: 'Lecture' },
    { courseId: '2', date: '2024-10-01', classType: 'Lecture' },
    { courseId: '2', date: '2024-10-06', classType: 'Lecture' },
    { courseId: '2', date: '2024-10-08', classType: 'Lecture' },
    { courseId: '2', date: '2024-10-13', classType: 'Lecture' },
    { courseId: '2', date: '2024-10-15', classType: 'Lecture' },

     // Marketing
    { courseId: '3', date: '2024-09-23', classType: 'Lecture' },
    { courseId: '3', date: '2024-09-25', classType: 'Lecture' },
    { courseId: '3', date: '2024-09-30', classType: 'Lecture' },
    { courseId: '3', date: '2024-10-02', classType: 'Lecture' },
    { courseId: '3', date: '2024-10-07', classType: 'Lecture' },
    { courseId: '3', date: '2024-10-09', classType: 'Lecture' },
    { courseId: '3', date: '2024-10-14', classType: 'Lecture' },
    { courseId: '3', date: '2024-10-16', classType: 'Lecture' },
];


export const mockAttendance: AttendanceRecord[] = [
  // SCM
  { id: 'att1', courseId: '1', date: '2024-09-22', classType: 'Lecture', status: 'Present' },
  { id: 'att2', courseId: '1', date: '2024-09-23', classType: 'Lecture', status: 'Present' },
  { id: 'att3', courseId: '1', date: '2024-09-29', classType: 'Lecture', status: 'Present' },
  { id: 'att4', courseId: '1', date: '2024-09-30', classType: 'Lecture', status: 'Not Taken' },
  { id: 'att5', courseId: '1', date: '2024-10-06', classType: 'Lecture', status: 'Absent' },
  { id: 'att6', courseId: '1', date: '2024-10-07', classType: 'Lecture', status: 'Present' },
  // { id: 'att7', courseId: '1', date: '2024-10-13', classType: 'Lecture', status: 'Present' }, // Today or future
  
  // Finance
  { id: 'att8', courseId: '2', date: '2024-09-22', classType: 'Lecture', status: 'Present' },
  { id: 'att9', courseId: '2', date: '2024-09-24', classType: 'Lecture', status: 'Present' },
  { id: 'att10', courseId: '2', date: '2024-09-29', classType: 'Lecture', status: 'Absent' },
  { id: 'att11', courseId: '2', date: '2024-10-01', classType: 'Lecture', status: 'Present' },
  { id: 'att12', courseId: '2', date: '2024-10-06', classType: 'Lecture', status: 'Present' },
  { id: 'att13', courseId: '2', date: '2024-10-08', classType: 'Lecture', status: 'Present' },

  // Marketing
  { id: 'att14', courseId: '3', date: '2024-09-23', classType: 'Lecture', status: 'Excused' },
  { id: 'att15', courseId: '3', date: '2024-09-25', classType: 'Lecture', status: 'Present' },
  { id: 'att16', courseId: '3', date: '2024-09-30', classType: 'Lecture', status: 'Present' },
  { id: 'att17', courseId: '3', date: '2024-10-02', classType: 'Lecture', status: 'Present' },
  { id: 'att18', courseId: '3', date: '2024-10-07', classType: 'Lecture', status: 'Present' },
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

export const mockJournalEntries: JournalEntry[] = [
  { id: 'je1', date: '2024-10-09T00:00:00.000Z', content: 'Today we discussed Porter\'s Five Forces in strategy class. It was interesting to apply it to the airline industry. Need to review the concept of "supplier power" more thoroughly.' },
  { id: 'je2', date: '2024-10-08T00:00:00.000Z', content: 'Had an informational interview with a PM at Google. She emphasized the importance of user empathy and storytelling. It was incredibly insightful. I should focus on developing these soft skills.' },
];
