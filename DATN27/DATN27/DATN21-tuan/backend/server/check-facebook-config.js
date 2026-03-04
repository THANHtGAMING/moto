// Script để kiểm tra cấu hình Facebook OAuth
require('dotenv').config();

console.log('🔍 Checking Facebook OAuth Configuration...\n');

const requiredVars = [
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'FACEBOOK_CALLBACK_URL'
];

let allPresent = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        // Ẩn secret để bảo mật
        if (varName === 'FACEBOOK_APP_SECRET') {
            console.log(`✅ ${varName}: ${value.substring(0, 4)}...${value.substring(value.length - 4)} (${value.length} chars)`);
        } else {
            console.log(`✅ ${varName}: ${value}`);
        }
    } else {
        console.log(`❌ ${varName}: NOT FOUND`);
        allPresent = false;
    }
});

console.log('\n' + '='.repeat(50));

if (allPresent) {
    console.log('✅ All Facebook OAuth variables are configured!');
    console.log('\nNext steps:');
    console.log('1. Restart your server: npm start');
    console.log('2. Check server logs for "✅ Facebook OAuth Strategy initialized"');
} else {
    console.log('❌ Missing required Facebook OAuth variables!');
    console.log('\nPlease add the missing variables to your .env file:');
    console.log('FACEBOOK_APP_ID=your_app_id');
    console.log('FACEBOOK_APP_SECRET=your_app_secret');
    console.log('FACEBOOK_CALLBACK_URL=/api/user/auth/facebook/callback');
}

console.log('\n' + '='.repeat(50));

