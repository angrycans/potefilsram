export const packageName = "@marslife/server";

export function healthCheck() {
  return {
    package: packageName,
    status: "ok",
    timestamp: new Date().toISOString()
  };
}
