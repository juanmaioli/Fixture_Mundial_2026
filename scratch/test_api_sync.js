const axios = require('axios');
const db = require('../db/connection');
const scraper = require('../services/scraper');

// Mapeo de nombres para normalizar
const countryNameMapping = {
  'united states': 'Estados Unidos',
  'usa': 'Estados Unidos',
  'morocco': 'Marruecos',
  'ecuador': 'Ecuador',
  'saudi arabia': 'Arabia Saudita',
  'england': 'Inglaterra',
  'wales': 'Gales',
  'iran': 'Irán',
  'senegal': 'Senegal',
  'argentina': 'Argentina',
  'mexico': 'México',
  'poland': 'Polonia',
  'australia': 'Australia',
  'france': 'Francia',
  'denmark': 'Dinamarca',
  'tunisia': 'Túnez',
  'peru': 'Perú',
  'spain': 'España',
  'germany': 'Alemania',
  'japan': 'Japón',
  'costa rica': 'Costa Rica',
  'belgium': 'Bélgica',
  'canada': 'Canadá',
  'croatia': 'Croacia',
  'cameroon': 'Camerún',
  'brazil': 'Brasil',
  'serbia': 'Serbia',
  'switzerland': 'Suiza',
  'ghana': 'Ghana',
  'portugal': 'Portugal',
  'uruguay': 'Uruguay',
  'south korea': 'Corea del Sur',
  'korea republic': 'Corea del Sur',
  'netherlands': 'Países Bajos',
  'italy': 'Italia',
  'colombia': 'Colombia',
  'nigeria': 'Nigeria',
  'ukraine': 'Ucrania',
  'chile': 'Chile',
  'sweden': 'Suecia',
  'algeria': 'Argelia',
  'egypt': 'Egipto',
  'paraguay': 'Paraguay',
  'scotland': 'Escocia',
  'turkey': 'Turquía',
  'ivory coast': 'Costa de Marfil',
  'cote d\'ivoire': 'Costa de Marfil',
  'austria': 'Austria',
  'venezuela': 'Venezuela',
  'norway': 'Noruega'
};

function normalizeCountryName(name) {
  if (!name) return '';
  const cleanName = name.toLowerCase().trim().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');
  if (countryNameMapping[cleanName]) {
    return countryNameMapping[cleanName];
  }
  return name;
}

async function testApiSync() {
  console.log('Realizando sincronización de prueba desde API...');
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719';
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
    const data = response.data;
    
    if (!data || !data.events) {
      console.log('No data');
      process.exit(0);
    }

    const matchesScraped = [];
    for (const event of data.events) {
      const competition = event.competitions[0];
      const status = event.status;
      
      // Solo nos interesan partidos completados (finalizados)
      if (status.type.completed) {
        const homeComp = competition.competitors.find(c => c.homeAway === 'home');
        const awayComp = competition.competitors.find(c => c.homeAway === 'away');
        
        if (homeComp && awayComp) {
          const homeName = normalizeCountryName(homeComp.team.displayName);
          const awayName = normalizeCountryName(awayComp.team.displayName);
          const homeScore = parseInt(homeComp.score, 10);
          const awayScore = parseInt(awayComp.score, 10);
          
          matchesScraped.push({
            homeTeam: homeName,
            awayTeam: awayName,
            homeScore,
            awayScore
          });
        }
      }
    }

    console.log(`Encontrados ${matchesScraped.length} partidos terminados en internet.`);
    
    // Probar cruce con BD
    const teams = db.prepare('SELECT * FROM teams').all();
    let matchedCount = 0;
    
    matchesScraped.forEach(m => {
      const home = teams.find(t => t.name.toLowerCase() === m.homeTeam.toLowerCase());
      const away = teams.find(t => t.name.toLowerCase() === m.awayTeam.toLowerCase());
      
      if (home && away) {
        matchedCount++;
        console.log(`Coincide: ${home.name} ${m.homeScore} - ${m.awayScore} ${away.name}`);
      } else {
        console.log(`NO coincide en BD: ${m.homeTeam} vs ${m.awayTeam}`);
      }
    });
    
    console.log(`Total coincidencias con nuestra BD: ${matchedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testApiSync();
