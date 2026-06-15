const axios = require('axios');

async function testEspnApi() {
  console.log('Consultando APIScoreboard de ESPN...');
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719';
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    });

    console.log('Respuesta recibida.');
    const data = response.data;
    
    if (data && data.events) {
      console.log(`Encontrados ${data.events.length} partidos/eventos.`);
      
      // Imprimir la estructura del primer evento
      const firstEvent = data.events[0];
      if (firstEvent) {
        console.log('Primer partido:');
        console.log(`ID: ${firstEvent.id}`);
        console.log(`Fecha: ${firstEvent.date}`);
        console.log(`Nombre: ${firstEvent.name}`);
        
        const competitors = firstEvent.competitions[0].competitors;
        competitors.forEach(c => {
          console.log(`- Equipo: ${c.team.displayName} (${c.team.abbreviation}), Goles: ${c.score}, Ganador: ${c.winner}`);
        });
      }
    } else {
      console.log('No se encontraron eventos en el JSON devuelto.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error al consultar la API de ESPN:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

testEspnApi();
