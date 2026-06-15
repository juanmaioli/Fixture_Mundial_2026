const axios = require('axios');
const cheerio = require('cheerio');

async function testFifaScrape() {
  console.log('Realizando request a FIFA.com...');
  const url = 'https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/standings';
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8'
      },
      timeout: 10000
    });

    console.log(`Respuesta recibida. Status: ${response.status}`);
    const $ = cheerio.load(response.data);
    
    // Ver si hay tablas de posiciones
    console.log('Analizando estructura...');
    const tables = $('table');
    console.log(`Encontradas ${tables.length} tablas en la página.`);
    
    // Buscar elementos típicos de tablas de posiciones
    const textSnippet = $('body').text().substring(0, 1000).replace(/\s+/g, ' ');
    console.log(`Snippet inicial de texto: ${textSnippet}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error al conectar con FIFA.com:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

testFifaScrape();
