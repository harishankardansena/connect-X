const mongoose = require('mongoose');

const uri = "mongodb://backupbantydansena:backupbantydansena@ac-yhhyldy-shard-00-00.iytudkz.mongodb.net:27017,ac-yhhyldy-shard-00-01.iytudkz.mongodb.net:27017,ac-yhhyldy-shard-00-02.iytudkz.mongodb.net:27017/chatapp?ssl=true&authSource=admin&retryWrites=true&w=majority";

console.log('Connecting to MongoDB...');
mongoose.connect(uri)
  .then(() => {
    console.log('✅ Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  });
