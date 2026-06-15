const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function saveCompleto() {
  console.log('Descargando JSON completo de la API de ESPN...');
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 15000
    });

    const outputPath = path.join(__dirname, 'espn_api_completo.json');
    fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
    console.log(`JSON completo guardado en: ${outputPath}`);
    process.exit(0);
  } catch (error) {
    console.error('Error al descargar:', error.message);
    process.exit(1);
  }
}

saveCompleto();
