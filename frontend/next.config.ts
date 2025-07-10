// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/auth",
        permanent: false, // true = 308 (permanent), false = 307 (temporary)
      },
    ];
  },
};
