module.exports = {
  devServer: {
    historyApiFallback: {
      rewrites: [
        {from: /^\/add-card$/, to: '/add-card.html' }
      ]
    },
    proxy: {
      '^/__/': {
        target: 'https://friendsbet-1bcc0.web.app/',
      },
    }
  }
};
