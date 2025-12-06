const axios = require('axios');
function createClient(token){
  return axios.create({
    baseURL: 'https://api.airtable.com',
    headers: { Authorization: `Bearer ${token}` }
  });
}

module.exports = { createClient };
