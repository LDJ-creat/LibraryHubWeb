export interface BookCopies {
    id: number;
    barcode: string; // 条形码
    location: string;// 存放位置
}

export interface BookReview {
    id: number;
    userAvatar?: string; // 用户头像 URL (可选)
    userName: string;
    rating: number; // 评分 (例如 1-5)
    commentText: string;
    commentDate: Date;
}

export interface Book {
    id: number;
    title: string;
    author: string;
    description: string;
    cover: string;
    publisher: string;
    publishedDate: Date;
    category: string;
    isbn: string; // 国际标准书号
    bookCopies: BookCopies[]; // 书籍副本信息
    reviews?: BookReview[]; // 书籍评论 (可选)
}
