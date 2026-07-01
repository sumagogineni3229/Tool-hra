const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://emosensee_db_user:papan@cluster0.wcdlf4z.mongodb.net/";

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected!');

  const db = mongoose.connection.client.db();

  console.log('Running aggregation to calculate photo field lengths on server-side...');
  const results = await db.collection('users').aggregate([
    {
      $project: {
        email: 1,
        userPhotoLength: { $strLenCP: { $ifNull: ["$userPhoto", ""] } },
        aadhaarPhotoLength: { $strLenCP: { $ifNull: ["$aadhaarPhoto", ""] } }
      }
    }
  ]).toArray();

  console.log('AGGREGATION_RESULTS_START');
  results.forEach(u => {
    console.log(`- ${u.email}: userPhotoLength = ${u.userPhotoLength} bytes, aadhaarPhotoLength = ${u.aadhaarPhotoLength} bytes`);
  });
  console.log('AGGREGATION_RESULTS_END');

  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
