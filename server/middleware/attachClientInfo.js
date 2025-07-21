module.exports = function attachClientInfo(req, res, next) {
  // Lấy IP từ header hoặc kết nối TCP
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;

  req.clientInfo = {
    ip,
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  next();
};
