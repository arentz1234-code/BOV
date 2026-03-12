module.exports = (req, res) => {
  res.status(200).json({
    message: 'BOV API is running',
    endpoints: ['/api/parse', '/api/test']
  });
};
