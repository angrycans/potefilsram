export const packageName = "@marslife/forum";

export function healthCheck() {
  return {
    package: packageName,
    status: "ok",
    timestamp: new Date().toISOString()
  };
}
