module.exports = {
  env: {
    es6: true,
    node: true,
    commonjs: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
