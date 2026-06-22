/** @type {import('postcss-load-config').ConfigFn} */
const config = ({ env }) => ({
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    cssnano: env === 'production' ? {} : false,
  },
});

module.exports = config;
