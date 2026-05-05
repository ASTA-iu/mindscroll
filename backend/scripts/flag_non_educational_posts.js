require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  // Flag posts that are likely not educational (based on the old logic)
  const result = await Post.updateMany(
    {
      $or: [
        { isEducational: false },
        { educationalScore: { $lt: 50 } }
      ]
    },
    {
      $set: { flagged: true }
    }
  );

  console.log(`Flagged ${result.modifiedCount} posts as non-educational.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
