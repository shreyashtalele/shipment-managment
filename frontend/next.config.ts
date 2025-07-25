// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/auth",
        permanent: false, 
      },
    ];
  },
};
