const merchantService = require('../services/merchantService');

/**
 * Middleware to authenticate requests via API Key and Secret
 */
const authenticate = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const apiSecret = req.headers['x-api-secret'];

  if (!apiKey || !apiSecret) {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        description: 'Missing API Key or Secret',
      },
    });
  }

  try {
    const merchant = await merchantService.findByCredentials(apiKey, apiSecret);

    if (!merchant) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Invalid API Key or Secret',
        },
      });
    }

    // Attach merchant to request for downstream use
    req.merchant = merchant;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Authentication failed',
      },
    });
  }
};

module.exports = authenticate;
