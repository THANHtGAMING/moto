const mongoose = require('mongoose');
const path = require('path');

// Try multiple paths for .env file
const envPaths = [
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
    try {
        require('dotenv').config({ path: envPath });
        if (process.env.MONGO_URI) {
            envLoaded = true;
            console.log(`✅ Loaded .env from: ${envPath}`);
            break;
        }
    } catch (e) {
        // Continue to next path
    }
}

if (!process.env.MONGO_URI) {
    console.error('❌ Không tìm thấy MONGO_URI trong .env file!');
    console.log('💡 Vui lòng đảm bảo file .env có biến MONGO_URI');
    process.exit(1);
}

const helpModel = require('../src/models/help.model');
const helpSeedData = require('./help-seed.json');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Kết nối thành công đến MongoDB');
    } catch (error) {
        console.error('❌ Kết nối thất bại đến MongoDB', error);
        process.exit(1);
    }
};

const seedHelp = async () => {
    try {
        // Xóa tất cả help items cũ (optional - comment out nếu muốn giữ lại)
        // await helpModel.deleteMany({});
        // console.log('🗑️  Đã xóa dữ liệu help cũ');

        // Đếm số lượng help items hiện có
        const existingCount = await helpModel.countDocuments();
        console.log(`📊 Số lượng help items hiện có: ${existingCount}`);

        // Insert help items
        let inserted = 0;
        let skipped = 0;

        for (const item of helpSeedData) {
            // Kiểm tra xem đã tồn tại chưa (dựa trên name)
            const existing = await helpModel.findOne({ name: item.name });
            
            if (!existing) {
                await helpModel.create(item);
                inserted++;
                console.log(`✅ Đã thêm: ${item.name}`);
            } else {
                skipped++;
                console.log(`⏭️  Đã tồn tại, bỏ qua: ${item.name}`);
            }
        }

        console.log('\n📈 Tổng kết:');
        console.log(`   - Đã thêm mới: ${inserted} items`);
        console.log(`   - Đã bỏ qua: ${skipped} items`);
        console.log(`   - Tổng số help items trong DB: ${await helpModel.countDocuments()}`);

        console.log('\n✅ Hoàn thành import dữ liệu help!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi import dữ liệu:', error);
        process.exit(1);
    }
};

// Chạy script
(async () => {
    await connectDB();
    await seedHelp();
})();

