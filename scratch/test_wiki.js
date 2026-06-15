const axios = require('axios');
const cheerio = require('cheerio');

async function testWikipedia() {
  console.log('Consultando Wikipedia para Copa Mundial 2026...');
  try {
    const response = await axios.get('https://es.wikipedia.org/wiki/Copa_Mundial_de_F%C3%BAtbol_de_2026', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Buscar los partidos en Wikipedia (típicamente usan clases .footballbox o tablas de partidos)
    const matches = $('.footballbox');
    console.log(`Encontrados ${matches.length} bloques de partidos (.footballbox)`);

    matches.slice(0, 5).each((i, el) => {
      const home = $(el).find('.home').text().trim();
      const away = $(el).find('.away').text().trim();
      const score = $(el).find('.score').text().trim();
      console.log(`Partido ${i}: ${home} [${score}] ${away}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error al consultar Wikipedia:', error.message);
    process.exit(1);
  }
}

testWikipedia();
