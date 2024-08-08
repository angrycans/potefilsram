import mongoose from "mongoose";

const connection: { isConnected?: number } = {};

export const connectDB = async () => {
  console.log("connectDB 0");
  if (connection.isConnected) {
    return;
  }

  console.log("connectDB 1", process.env.MONGODB_URI);

  if (!process.env.MONGODB_URI) {
    console.log("Error: Invalid/Missing environment variable MONGODB_URI");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, { socketTimeoutMS: 50000 });

    // console.log("connectDB 2", db);
    connection.isConnected = db.connections[0].readyState;

    if (connection.isConnected === 1) {
      console.log("🚀 Successfully connected to database");
    } else {
      console.log("🔴 Failed to connect to database");
    }
  } catch (error) {
    console.log("🔴 Failed to connect to MongoDB:", (error as Error).message);
  }
};
