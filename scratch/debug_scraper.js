const axios = require('axios');
const cheerio = require('cheerio');

async function debugScraper() {
  console.log('Realizando request a ESPN...');
  try {
    const response = await axios.get('https://www.espn.com.ar/futbol/fixture/_/liga/fifa.world', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const matchesScraped = [];

    // Imprimir algunos textos para entender la estructura de la página de ESPN actual en 2026
    console.log('Analizando estructura HTML de ESPN...');
    
    // Buscar filas de la tabla
    const rows = $('.Table__TR');
    console.log(`Encontradas ${rows.length} filas con clase .Table__TR`);
    
    rows.slice(0, 10).each((i, element) => {
      const htmlSnippet = $(element).html().substring(0, 200);
      console.log(`Fila ${i}:Snippet: ${htmlSnippet.replace(/\s+/g, ' ')}`);
      
      const homeTeamName = $(element).find('.team-names').first().text().trim();
      const awayTeamName = $(element).find('.team-names').last().text().trim();
      const scoreText = $(element).find('.record').text().trim();
      
      console.log(`=> Home: "${homeTeamName}", Away: "${awayTeamName}", Score: "${scoreText}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error en request:', error.message);
    process.exit(1);
  }
}

debugScraper();
