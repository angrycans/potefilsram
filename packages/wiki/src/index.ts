export const packageName = "@marslife/wiki";

export function healthCheck() {
  return {
    package: packageName,
    status: "ok",
    timestamp: new Date().toISOString()
  };
}
