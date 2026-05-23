export interface Pet {
  id: string;
  name: string;
  age: number;
  weight: number;
  photo?: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
}

export interface HealthEvent {
  id: string;
  petId: string;
  type: 'vaccine' | 'deworming' | 'checkup' | 'other';
  title: string;
  date: string; // ISO string
  completed: boolean;
  notes?: string;
}

export interface DailyLog {
  id: string;
  petId: string;
  date: string; // ISO string
  symptoms: string;
  behavior: string;
  mood: 'happy' | 'calm' | 'anxious' | 'tired' | 'unwell';
}
