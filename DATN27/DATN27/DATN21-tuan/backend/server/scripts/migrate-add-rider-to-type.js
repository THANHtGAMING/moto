/**
 * Migration script: ensure existing types have riderProduct field (null)
 * and rebuild indexes for the new unique index.
 * 
 * This script:
 * 1. Ensures all existing type documents have the riderProduct field (set to null if missing)
 * 2. Rebuilds indexes to ensure the new unique index { nameType: 1, riderProduct: 1 } is created
 * 
 * Usage:
 *   NODE_ENV=production node scripts/migrate-add-rider-to-type.js
 * 
 * Make sure to set MONGO_URI in your .env file before running.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const typeModel = require('../src/models/type.model');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Kết nối thành công đến MongoDB');
    } catch (error) {
        console.error('✗ Kết nối thất bại đến MongoDB', error);
        process.exit(1);
    }
};

const migrateAddRiderToType = async () => {
    try {
        console.log('\n=== Bắt đầu migration: Thêm riderProduct vào Type và rebuild indexes ===\n');

        // Step 1: Ensure all types have riderProduct field (set to null if missing)
        console.log('Bước 1: Đảm bảo tất cả type có field riderProduct...');
        const result = await typeModel.updateMany(
            { riderProduct: { $exists: false } },
            { $set: { riderProduct: null } }
        );
        console.log(`✓ Đã cập nhật ${result.modifiedCount} type document(s) (thêm riderProduct = null)\n`);

        // Step 2: Rebuild indexes
        console.log('Bước 2: Rebuild indexes...');
        try {
            // Use syncIndexes to ensure all indexes defined in the model are created
            await typeModel.syncIndexes();
            console.log('✓ Đã rebuild indexes thành công');
        } catch (indexError) {
            console.warn('⚠ Cảnh báo khi rebuild indexes:', indexError.message);
            console.log('  Bạn có thể cần tạo index thủ công trong MongoDB:');
            console.log('  db.types.createIndex({ nameType: 1, riderProduct: 1 }, { unique: true, sparse: true })');
        }

        // Step 3: Verify indexes
        console.log('\nBước 3: Kiểm tra indexes...');
        const indexes = await typeModel.collection.getIndexes();
        console.log('Các indexes hiện có:');
        Object.keys(indexes).forEach(indexName => {
            console.log(`  - ${indexName}:`, JSON.stringify(indexes[indexName].key));
        });

        // Check if the new index exists
        const hasRiderIndex = Object.keys(indexes).some(name => {
            const index = indexes[name];
            return index.key && 
                   index.key.nameType === 1 && 
                   index.key.riderProduct === 1;
        });

        if (hasRiderIndex) {
            console.log('\n✓ Index { nameType: 1, riderProduct: 1 } đã tồn tại');
        } else {
            console.log('\n⚠ Index { nameType: 1, riderProduct: 1 } chưa tồn tại');
            console.log('  Vui lòng tạo index thủ công trong MongoDB:');
            console.log('  db.types.createIndex({ nameType: 1, riderProduct: 1 }, { unique: true, sparse: true })');
        }

        console.log('\n=== Kết quả migration ===');
        console.log(`✓ Đã cập nhật: ${result.modifiedCount} type document(s)`);
        console.log('\n=== Hoàn thành ===\n');

    } catch (error) {
        console.error('✗ Lỗi trong quá trình migration:', error);
        throw error;
    }
};

const main = async () => {
    await connectDB();
    await migrateAddRiderToType();
    await mongoose.connection.close();
    console.log('Đã đóng kết nối MongoDB');
    process.exit(0);
};

// Run migration
main().catch((error) => {
    console.error('Migration thất bại:', error);
    process.exit(1);
});

