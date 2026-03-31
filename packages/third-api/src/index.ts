export const packageName = "@marslife/third-api";

export function healthCheck() {
  return {
    package: packageName,
    status: "ok",
    timestamp: new Date().toISOString()
  };
}
