import mongoose from "mongoose";
import { User } from "./models/User";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

async function run() {
  await mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost:27017/social");

  const users = await User.find({});
  console.log(`Found ${users.length} users in the database.`);
  const result = await User.updateMany(
    { isVerified: { $exists: false } },
    {
      $set: {
        isVerified: false,
        role: "user",
        followerCount: 0,
        followingCount: 0,
        bookmarksCount: 0,
      }
    }
  );

  console.log(`Patched ${result.modifiedCount} users.`);
  process.exit(0);
}

run().catch(console.error);
