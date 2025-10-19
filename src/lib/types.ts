import { z } from "zod";

// --- Module Type ---
export type Module = {
  id: string;
  created_at: string;
  title: string;
  semester: string | null;
};

// --- Course & Session Types ---
export type Course = {
  id: string;
  created_at: string;
  title: string;
  code: string | null;
  professor: string | null;
  term: string | null;
  total_scheduled_sessions: number;
  module_id: string | null;
  mandatory_attendance_percentage: number;
};

// --- NEW: Simplified Course type for Calendar dropdown ---
export type CourseForCalendar = Pick<Course, 'id' | 'title' | 'code'>;


export type AttendanceStatus = 'present' | 'absent' | 'proxy' | 'not-taken';

export type Session = {
  id: string;
  created_at: string;
  course_id: string;
  date: string; // ISO string
  status: AttendanceStatus;
};

export type CourseStats = {
  course_id: string;
  scheduled: number;
  conducted: number;
  attended: number;
};

// --- Skill Tracker Types ---
export type Skill = {
  id: string;
  created_at: string;
  name: string;
  type: 'Hard' | 'Soft';
  notes: string | null;
  latest_confidence: number;
};

export type SkillConfidenceLog = {
  id: string;
  created_at: string;
  skill_id: string;
  confidence_level: number;
};

// --- Goal (OKR) Types ---
export type KeyResult = {
  id: string;
  created_at: string;
  objective_id: string;
  description: string;
  is_completed: boolean;
};

export type Objective = {
  id: string;
  created_at: string;
  title: string;
  semester: string | null;
  key_results: KeyResult[];
};

// --- Journal Entry Type ---
export type JournalEntry = {
  id: string;
  created_at: string;
  entry_date: string; // YYYY-MM-DD format
  content: string;
};

// --- Deadline Type ---
export type Deadline = {
  id: string;
  created_at: string;
  course_id: string;
  title: string;
  due_date: string; // ISO timestamp string
  description: string | null;
  type: string; // 'Assignment', 'Exam', etc.
  // Optional: Add course details if needed after joining in query
  courses?: { title: string; code: string | null } | null;
};

