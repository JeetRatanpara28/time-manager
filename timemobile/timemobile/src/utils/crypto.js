// src/utils/crypto.js
import { hashSync, compareSync, genSaltSync } from "bcrypt-ts";

const SALT_ROUNDS = 10;

export function hashPassword(password) {
  const salt = genSaltSync(SALT_ROUNDS);
  return hashSync(password, salt);
}

export function comparePassword(password, hash) {
  return compareSync(password, hash);
}
