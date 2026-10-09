const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.server.enhanceMiddleware = (metroMiddleware) => {
  return (req, res, next) => {
    const accept = req.headers.accept;
    if (accept && req.url && req.url.includes('.bundle')) {
      req.headers.accept = accept
        .split(',')
        .map((part) => part.trim())
        .filter((part) => !part.toLowerCase().startsWith('multipart/mixed'))
        .join(', ');
    }
    return metroMiddleware(req, res, next);
  };
};

module.exports = config;
