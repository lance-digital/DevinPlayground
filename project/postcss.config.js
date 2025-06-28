export default {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-custom-properties': {},
    'postcss-import': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': true,
      }
    }
  }
}