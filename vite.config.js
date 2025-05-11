export default {
  base: process.env.NODE_ENV === "production" ? "/asteroid-pew-pew/" : "/",
  publicDir: "res",
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
  }
};
