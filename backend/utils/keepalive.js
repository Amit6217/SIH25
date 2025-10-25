const axios = require('axios');

function startKeepAlive(urls, interval = 10 * 60 * 1000) { // every 10 minutes
  if (!urls || urls.length === 0) {
    console.warn('⚠️ No URLs provided for keep-alive.');
    return;
  }

  console.log('🕒 Keep-alive service started for:', urls);

  const ping = async (url) => {
    try {
      const res = await axios.get(url);
      console.log(`✅ Keep-alive ping successful: ${url} (${res.status})`);
    } catch (err) {
      console.error(`❌ Keep-alive ping failed: ${url} - ${err.message}`);
    }
  };

  // Immediately ping once, then repeat
  urls.forEach(ping);
  setInterval(() => urls.forEach(ping), interval);
}

module.exports = { startKeepAlive };
