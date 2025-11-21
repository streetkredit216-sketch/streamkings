export interface Photo {
    id: string;
    imageUrl: string;
    description: string;
    createdAt: string;
    author: {
        username: string;
        profilePic: string;
        walletAddress: string;
    };
    _count?: {
        comments: number;
        savedBy: number;
    };
 }