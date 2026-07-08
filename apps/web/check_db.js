const mongoose = require('mongoose');

async function check() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error("DATABASE_URL is not defined in the environment.");
    process.exit(1);
  }

  // Parse URI securely (do not print credentials)
  let dbHost = "";
  let dbName = "";
  try {
    const parsed = new URL(uri.startsWith('mongodb+srv') ? uri.replace('mongodb+srv://', 'http://') : uri);
    dbHost = parsed.host;
    dbName = parsed.pathname.substring(1) || "(default/test)";
  } catch (e) {
    dbHost = "Unable to parse host";
    dbName = "Unable to parse db name";
  }
  console.log("Database Host:", dbHost);
  console.log("Database Name:", dbName);

  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const usersCol = db.collection('users');
    const indexes = await usersCol.indexes();
    console.log("Users Indexes:", JSON.stringify(indexes, null, 2));

    const totalUsers = await usersCol.countDocuments();
    const missingUsername = await usersCol.countDocuments({ username: { $exists: false } });
    const nullUsername = await usersCol.countDocuments({ username: null });

    console.log("Total Users:", totalUsers);
    console.log("Users with missing username field:", missingUsername);
    console.log("Users with username explicitly null:", nullUsername);

  } catch (err) {
    console.error("Error during check:", err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
