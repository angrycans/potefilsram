import mongoose from "mongoose";
/*

model User {
  id            String          @id @default(auto()) @map("_id") @db.ObjectId
  name          String?
  email         String?         @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  // Optional for WebAuthn support
  Authenticator Authenticator[]
 
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
*/
const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    // password: { type: String },
    email: { type: String, unique: true },
    emailVerified: { type: Date },
    image: { type: String },
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Account" }],
    sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }],
    authenticators: [{ type: mongoose.Schema.Types.ObjectId, ref: "Authenticator" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { strict: false }
);

const User = mongoose.models.User || mongoose.model("User", userSchema, "User");

export default User;
