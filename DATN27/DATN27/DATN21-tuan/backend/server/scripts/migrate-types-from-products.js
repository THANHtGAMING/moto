/**
 * Migration script to infer type.categoryProduct from products
 * 
 * This script scans all products and assigns categoryProduct to type documents
 * if a type is only used with one unique category and the type doesn't already have a categoryProduct.
 * 
 * Usage:
 *   node scripts/migrate-types-from-products.js
 * 
 * Make sure to set MONGO_URI in your .env file before running.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const productModel = require('../src/models/product.model');
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

const migrateTypesFromProducts = async () => {
    try {
        console.log('\n=== Bắt đầu migration: Gán categoryProduct cho Type từ Products ===\n');

        // Group products by typeProduct and collect unique categoryProduct values
        const typeCategoryMap = await productModel.aggregate([
            {
                $match: {
                    typeProduct: { $ne: null },
                    categoryProduct: { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$typeProduct',
                    categories: { $addToSet: '$categoryProduct' },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log(`Tìm thấy ${typeCategoryMap.length} type có sản phẩm liên kết\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const item of typeCategoryMap) {
            const typeId = item._id;
            const categories = item.categories;

            // Only update if type has exactly one unique category
            if (categories.length === 1) {
                const categoryId = categories[0];

                // Check if type exists and doesn't already have categoryProduct
                const typeDoc = await typeModel.findById(typeId);
                if (!typeDoc) {
                    console.log(`⚠ Type ${typeId} không tồn tại, bỏ qua`);
                    skippedCount++;
                    continue;
                }

                if (typeDoc.categoryProduct) {
                    console.log(`⊘ Type "${typeDoc.nameType}" (${typeId}) đã có categoryProduct, bỏ qua`);
                    skippedCount++;
                    continue;
                }

                // Update type with categoryProduct
                try {
                    typeDoc.categoryProduct = categoryId;
                    await typeDoc.save();
                    console.log(`✓ Đã gán categoryProduct cho type "${typeDoc.nameType}" (${typeId})`);
                    updatedCount++;
                } catch (error) {
                    if (error.code === 11000) {
                        console.log(`⚠ Type "${typeDoc.nameType}" (${typeId}) gặp lỗi duplicate index, bỏ qua`);
                        skippedCount++;
                    } else {
                        console.error(`✗ Lỗi khi cập nhật type ${typeId}:`, error.message);
                        errorCount++;
                    }
                }
            } else {
                console.log(`⊘ Type ${typeId} được dùng với ${categories.length} category khác nhau, bỏ qua`);
                skippedCount++;
            }
        }

        console.log('\n=== Kết quả migration ===');
        console.log(`✓ Đã cập nhật: ${updatedCount} type`);
        console.log(`⊘ Đã bỏ qua: ${skippedCount} type`);
        console.log(`✗ Lỗi: ${errorCount} type`);
        console.log('\n=== Hoàn thành ===\n');

    } catch (error) {
        console.error('✗ Lỗi trong quá trình migration:', error);
        throw error;
    }
};

const main = async () => {
    await connectDB();
    await migrateTypesFromProducts();
    await mongoose.connection.close();
    console.log('Đã đóng kết nối MongoDB');
    process.exit(0);
};

// Run migration
main().catch((error) => {
    console.error('Migration thất bại:', error);
    process.exit(1);
});

