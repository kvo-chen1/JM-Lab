
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to backup.json
const backupPath = path.join(__dirname, '../server/data/backup.json');

// Helper to get random item from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate UUID (simple version)
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

async function main() {
    console.log('Reading backup.json...');
    if (!fs.existsSync(backupPath)) {
        console.error('backup.json not found!');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    if (!data.users || data.users.length === 0) {
        console.error('No users found in backup.json. Please create some users first.');
        process.exit(1);
    }

    console.log(`Found ${data.users.length} users.`);

    // Work categories and tags
    const categories = ['AI设计', '插画设计', '3D设计', '平面设计', 'UI设计'];
    const tagsList = ['国潮', '赛博朋克', '极简', '复古', '抽象', '自然', '城市'];

    // Generate 30 mock works
    const newWorks = [];
    const now = Date.now();

    for (let i = 0; i < 30; i++) {
        const user = getRandom(data.users);
        const category = getRandom(categories);
        const tags = [category, getRandom(tagsList)];
        
        // Generate a random time within last 7 days
        const createdAt = now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);

        newWorks.push({
            id: uuid(),
            title: `${category}作品 - ${i + 1}`,
            description: `这是一个由 ${user.username} 创建的精彩${category}作品示例。包含一些详细的描述文本。`,
            creator_id: user.id,
            cover_url: `https://picsum.photos/seed/${i}/600/800`, // Use picsum for random images
            thumbnail: `https://picsum.photos/seed/${i}/300/400`,
            images: [
                `https://picsum.photos/seed/${i}/600/800`,
                `https://picsum.photos/seed/${i}_2/600/800`
            ],
            video_url: '',
            category: category,
            tags: tags,
            likes: Math.floor(Math.random() * 500),
            views: Math.floor(Math.random() * 5000),
            comments: Math.floor(Math.random() * 50),
            status: 'published',
            created_at: createdAt,
            updated_at: createdAt
        });
    }

    // Merge with existing works (or replace if you want to clean up)
    // Here we replace to ensure clean state
    data.works = newWorks;

    console.log(`Generated ${newWorks.length} mock works.`);

    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log('backup.json updated successfully.');
    console.log('IMPORTANT: Please restart the dev server (pnpm dev) and clear your browser LocalStorage to see changes.');
}

main().catch(console.error);
