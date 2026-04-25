require('dotenv').config();
console.log('MONGO_URI start:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + '...' : 'undefined');
