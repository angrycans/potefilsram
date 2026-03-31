export const packageName = "@marslife/blog";

export function healthCheck() {
  return {
    package: packageName,
    status: "ok",
    timestamp: new Date().toISOString()
  };
}
