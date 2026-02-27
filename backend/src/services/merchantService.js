const db = require('../config/db');

class MerchantService {
  /**
   * Find a merchant by API key and Secret
   * @param {string} apiKey 
   * @param {string} apiSecret 
   * @returns {Promise<object|null>} Merchant object or null
   */
  async findByCredentials(apiKey, apiSecret) {
    const query = `
      SELECT * FROM merchants 
      WHERE api_key = $1 AND api_secret = $2
    `;
    const result = await db.query(query, [apiKey, apiSecret]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * Find a merchant by ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const query = 'SELECT * FROM merchants WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
}

module.exports = new MerchantService();
