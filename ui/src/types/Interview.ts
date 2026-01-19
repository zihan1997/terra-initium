export interface InterviewQuestion {
  id: number;
  text: string;
}

export interface Interview {
  id: number;
  date: string;
  client: string;
  vendor: string;
  interviewer: string;
  candidate: string;
  position: string;
  questions: InterviewQuestion[];
}
