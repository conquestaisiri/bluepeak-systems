import type { Env } from "./env";

let env: Env | null = null;

export function initEnv(value: Env): void {
  env = value;
}

export function getEnv(): Env {
  if (!env) {
    throw new Error("Environment not initialized. Call initEnv() with the Worker bindings first.");
  }
  return env;
}
