export interface Recommendation{
    id: number;
    bookId: number | null; // Added bookId
    title: string;
    author: string;
    description: string;
    cover: string;
}

export interface Announcement {
    id: number;
    title: string;
    publishedDate: Date;
    cover: string;
}