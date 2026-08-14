import "dotenv/config";
import mongoose from "mongoose";

// Point every test run at a dedicated `<db>-test` database so tests never
// touch real project data, even if MONGODB_URI points at production.
const buildTestUri = (uri) => uri.replace(/\/([^/?]+)(\?|$)/, "/$1-test$2");

export const connectTestDb = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(buildTestUri(process.env.MONGODB_URI));
  }
};

export const clearCollections = async (...names) => {
  for (const name of names) {
    const collection = mongoose.connection.collections[name];

    if (collection) {
      await collection.deleteMany({});
    }
  }
};

export const disconnectTestDb = async () => {
  await mongoose.disconnect();
};
