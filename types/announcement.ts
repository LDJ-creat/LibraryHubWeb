export interface Announcement {
  id: number;
  createTime: string;
  updateTime: string;
  deleteTime: string | null;
  title: string;
  content: string;
  author: string;
  authorId: number | null;
  coverImage: string | null;
  tags: string | null; // Assuming tags is a string, adjust if it's an array or other type
  views: number;
  likes: number;
  comments: number;
}
