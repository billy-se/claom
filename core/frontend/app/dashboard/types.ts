export interface Comment {
    id: string;
    author: string;
    text: string;
    timestamp: string;
    replies?: Comment[];
}

export interface Argument {
  id: number;
  author: string;
  title: string;
  content: string;
  logic_score: number;
  created_at: string;
  comments?: Comment[];
}