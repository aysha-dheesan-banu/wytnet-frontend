import { User, WishlistItem, Education, Work, Social, Interest } from '../api/types';

export const calculateProfileCompletion = (
    user: User | null,
    wishlist: WishlistItem[] = [],
    education: Education[] = [],
    works: Work[] = [],
    socials: Social[] = [],
    interests: Interest[] = []
): number => {
    if (!user) return 0;

    let score = 0;

    // 1. Personal (20% total - 2% each for 10 fields)
    const personalFields: (keyof User)[] = [
        'full_name', 'nickname', 'phone', 'location',
        'bio', 'gender', 'dob', 'marital_status',
        'mother_tongue', 'languages'
    ];
    personalFields.forEach(field => {
        if (user[field] && String(user[field]).trim() !== '') score += 2;
    });

    // 2. Wishlist (16%)
    if (wishlist.length > 0) score += 16;

    // 3. Education (16%)
    if (education.length > 0) score += 16;

    // 4. Works (16%)
    if (works.length > 0) score += 16;

    // 5. Socials (16%)
    if (socials.length > 0) score += 16;

    // 6. Interests (16%)
    if (interests.length > 0) score += 16;

    // Final balance: 20 + (16 * 5) = 100
    return Math.min(Math.round(score), 100);
};
