const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function saveSample() {
  console.log('Consultando API de ESPN...');
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    });

    const data = response.data;
    
    if (data && data.events) {
      // Tomamos una muestra de los primeros 2 partidos para no generar un archivo gigante
      const sampleEvents = data.events.slice(0, 2);
      const sampleJson = {
        total_events_found: data.events.length,
        sample_events: sampleEvents
      };
      
      const outputPath = path.join(__dirname, 'espn_api_sample.json');
      fs.writeFileSync(outputPath, JSON.stringify(sampleJson, null, 2));
      console.log(`Muestra guardada con éxito en: ${outputPath}`);
    } else {
      console.log('No se encontraron eventos en la respuesta.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error al consultar o guardar la muestra:', error.message);
    process.exit(1);
  }
}

saveSample();
