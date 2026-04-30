import { randomUUID } from "crypto";
import { redis } from "@/lib/redis";
import type { UserRole } from "@/types";

export type StoredUser = {
  id: string;
  email: string;
  passwordHash?: string;
  name?: string | null;
  image?: string | null;
  role: UserRole;
  emailVerified?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateUserInput = {
  email: string;
  passwordHash?: string;
  name?: string | null;
  image?: string | null;
  role?: UserRole;
  emailVerified?: string | null;
};

const DEFAULT_ROLE: UserRole = "USER";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const userKey = (id: string) => `user:${id}`;
const userEmailKey = (email: string) => `user:email:${normalizeEmail(email)}`;

export async function getUserIdByEmail(email: string) {
  return redis.get<string>(userEmailKey(email));
}

export async function getUserById(id: string) {
  if (!id) {
    return null;
  }

  return (await redis.get<StoredUser>(userKey(id))) ?? null;
}

export async function getUserByEmail(email: string) {
  const userId = await getUserIdByEmail(email);

  if (!userId) {
    return null;
  }

  return getUserById(userId);
}

export async function createUser(input: CreateUserInput) {
  const email = normalizeEmail(input.email);
  const existingUserId = await getUserIdByEmail(email);

  if (existingUserId) {
    throw new Error("User already exists.");
  }

  const timestamp = new Date().toISOString();
  const user: StoredUser = {
    id: randomUUID(),
    email,
    passwordHash: input.passwordHash,
    name: input.name ?? null,
    image: input.image ?? null,
    role: input.role ?? DEFAULT_ROLE,
    emailVerified: input.emailVerified ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await redis.multi().set(userKey(user.id), user).set(userEmailKey(email), user.id).exec();

  return user;
}

export async function upsertOAuthUser(input: Omit<CreateUserInput, "passwordHash">) {
  const email = normalizeEmail(input.email);
  const existing = await getUserByEmail(email);

  if (existing) {
    const updatedUser: StoredUser = {
      ...existing,
      name: input.name ?? existing.name ?? null,
      image: input.image ?? existing.image ?? null,
      emailVerified: input.emailVerified ?? existing.emailVerified ?? null,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(userKey(existing.id), updatedUser);
    return updatedUser;
  }

  return createUser({
    ...input,
    email,
  });
}
