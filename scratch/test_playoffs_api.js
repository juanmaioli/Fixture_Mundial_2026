const axios = require('axios');

async function test() {
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.espn.com.ar/'
      },
      timeout: 10000
    });

    const data = response.data;
    if (data && data.events) {
      console.log(`Total de eventos obtenidos: ${data.events.length}`);
      
      for (const event of data.events) {
        const competition = event.competitions && event.competitions[0];
        const status = event.status;
        const note = competition?.altGameNote || '';
        
        // Si no es de fase de grupos (no tiene "Group" en la nota) o si es playoff
        if (competition && (!note.includes('Group') || note.toLowerCase().includes('round') || note.toLowerCase().includes('quarter') || note.toLowerCase().includes('semi') || note.toLowerCase().includes('final'))) {
          const homeComp = competition.competitors.find(c => c.homeAway === 'home');
          const awayComp = competition.competitors.find(c => c.homeAway === 'away');
          
          console.log(`\nPlayoff Match: ${homeComp.team.displayName} vs ${awayComp.team.displayName}`);
          console.log(`- Nota/Etapa: ${note}`);
          console.log(`- Status: ${status?.type?.name} (Completed: ${status?.type?.completed})`);
          console.log(`- Scores: ${homeComp.score} - ${awayComp.score}`);
          
          // Revisar si hay penales
          if (homeComp.shootoutScore || awayComp.shootoutScore) {
            console.log(`- Penales: ${homeComp.shootoutScore} - ${awayComp.shootoutScore}`);
          }
          // Ver todo el competitor para ver si hay detalles
          console.log(`- Home Competitor keys: ${Object.keys(homeComp).join(', ')}`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
