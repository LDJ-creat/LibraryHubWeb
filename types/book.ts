export interface BookCopies {
    id: number;
    barcode: string; // 条形码
}

export interface BookReview {
    id: number;
    userAvatar?: string; // 用户头像 URL (可选)
    userName: string;
    rating: number; // 评分 (例如 1-5)
    commentText: string;
    commentDate: string; // 评论日期字符串
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
    callNumber: string;//索书号
    location: string; //图书位置
    price: number;//价格
    edition: string;// 版本
    pages: number;//页数
    bookCopies: BookCopies[]; // 书籍副本信息
    reviews?: BookReview[]; // 书籍评论 (可选)
    recommendations?: BookSearchResult[]; // 相关书籍推荐 (可选)
    ratingDistribution?: number[]; // [1 star, 2 stars, 3 stars, 4 stars, 5 stars]
    ratingAvg?: number;
    ratingCount?: number;
}

export interface BookSearchResult {
    id: number;
    title: string;
    author: string;
    publisher?: string; // Made optional
    publishedDate?: string; // Made optional
    cover: string;
}
