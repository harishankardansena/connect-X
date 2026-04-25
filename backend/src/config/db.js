const mongoose = require('mongoose');
const dns = require('dns');

// 🔧 Force Google DNS to bypass network DNS blocks
// Fixes: querySrv ECONNREFUSED _mongodb._tcp.xxx.mongodb.net
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is missing in .env');
  }

  console.log('📡 Connecting to MongoDB...');
  const conn = await mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 15000,
  });
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
