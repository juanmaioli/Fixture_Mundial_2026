const axios = require('axios');
const db = require('../db/connection');
const fixtureService = require('./fixtureService');

// Mapeo completo de nombres en inglés normalizados de la API de ESPN a español de Argentina
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
  'turkiye': 'Turquía',
  'ivory coast': 'Costa de Marfil',
  'cote d\'ivoire': 'Costa de Marfil',
  'cote divoire': 'Costa de Marfil',
  'austria': 'Austria',
  'venezuela': 'Venezuela',
  'norway': 'Noruega',
  'south africa': 'Sudáfrica',
  'czechia': 'República Checa',
  'czech republic': 'República Checa',
  'bosnia-herzegovina': 'Bosnia-Herzegovina',
  'qatar': 'Catar',
  'haiti': 'Haití',
  'curacao': 'Curazao',
  'new zealand': 'Nueva Zelanda',
  'cape verde': 'Cabo Verde',
  'iraq': 'Irak',
  'jordan': 'Jordania',
  'congo dr': 'Congo RD',
  'dr congo': 'Congo RD',
  'democratic republic of congo': 'Congo RD',
  'uzbekistan': 'Uzbekistán',
  'panama': 'Panamá'
};

// Normalizar nombres de países removiendo diacríticos y buscando en el mapeo
function normalizeCountryName(name) {
  if (!name) return '';
  
  // Normalización Unicode robusta (elimina acentos, diéresis, etc.)
  const cleanName = name.toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, 'n');
  
  if (countryNameMapping[cleanName]) {
    return countryNameMapping[cleanName];
  }
  return name;
}

// Función principal de sincronización con API JSON de ESPN
// Función principal de sincronización con API JSON de ESPN
async function syncFixture() {
  console.log('Iniciando sincronización de fixture con API de ESPN...');
  
  let syncSuccess = false;
  
  try {
    // Consultar API de Scoreboard de ESPN para el rango de fechas del Mundial 2026 (11 de junio al 19 de julio)
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
    
    if (data && data.events && data.events.length > 0) {
      const matchesScraped = [];

      for (const event of data.events) {
        const competition = event.competitions && event.competitions[0];
        const status = event.status;
        
        if (competition && status && status.type) {
          const homeComp = competition.competitors.find(c => c.homeAway === 'home');
          const awayComp = competition.competitors.find(c => c.homeAway === 'away');
          
          if (homeComp && awayComp) {
            const homeName = normalizeCountryName(homeComp.team.displayName);
            const awayName = normalizeCountryName(awayComp.team.displayName);
            const isCompleted = status.type.completed === true;

            let homeScore = null;
            let awayScore = null;

            if (isCompleted) {
              homeScore = parseInt(homeComp.score, 10);
              awayScore = parseInt(awayComp.score, 10);
              
              if (!isNaN(homeScore) && !isNaN(awayScore)) {
                // Si es un empate pero hay definición por penales en la API (winner: true)
                // le sumamos 1 gol simbólico al ganador para romper el empate en nuestra BD local
                if (homeScore === awayScore) {
                  if (homeComp.winner === true) {
                    homeScore += 1;
                  } else if (awayComp.winner === true) {
                    awayScore += 1;
                  }
                }
              }
            }

            const altGameNote = competition.altGameNote || '';

            matchesScraped.push({
              homeTeam: homeName,
              awayTeam: awayName,
              homeScore,
              awayScore,
              isCompleted,
              altGameNote
            });
          }
        }
      }

      if (matchesScraped.length > 0) {
        console.log(`API Sincro: se encontraron ${matchesScraped.length} partidos en internet.`);
        const updatedCount = updateMatchesFromScrapedData(matchesScraped);
        console.log(`Se actualizaron o alinearon ${updatedCount} partidos en la base de datos.`);
        if (updatedCount > 0) {
          syncSuccess = true;
        }
      }
    }
  } catch (error) {
    console.error('Error al conectar con la API de ESPN:', error.message);
  }

  if (!syncSuccess) {
    console.log('Sincronización finalizada. No se aplicaron nuevos cambios (los partidos ya están actualizados o no coinciden selecciones de nuestra BD).');
  }

  // Recalcular cruces de play-off según los nuevos resultados
  fixtureService.updatePlayoffBracket();
}

// Actualizar base de datos local con datos reales obtenidos
function updateMatchesFromScrapedData(scrapedMatches) {
  const teams = db.prepare('SELECT * FROM teams').all();
  let updatedCount = 0;

  // Helper para detectar la etapa eliminatoria
  const detectStageFromNote = (note) => {
    if (!note) return null;
    const lowerNote = note.toLowerCase();
    if (lowerNote.includes('round of 32')) return 'round_of_32';
    if (lowerNote.includes('round of 16')) return 'round_of_16';
    if (lowerNote.includes('quarter')) return 'quarters';
    if (lowerNote.includes('semi')) return 'semis';
    if (lowerNote.includes('third') || lowerNote.includes('3rd')) return 'third_place';
    if (lowerNote.includes('final')) return 'final';
    return null;
  };

  db.transaction(() => {
    for (const match of scrapedMatches) {
      // Buscar equipo local y visitante en nuestra base de datos (por nombre directo o normalizado)
      const home = teams.find(t => 
        t.name.toLowerCase() === match.homeTeam.toLowerCase() || 
        normalizeCountryName(t.name).toLowerCase() === match.homeTeam.toLowerCase()
      );
      
      const away = teams.find(t => 
        t.name.toLowerCase() === match.awayTeam.toLowerCase() || 
        normalizeCountryName(t.name).toLowerCase() === match.awayTeam.toLowerCase()
      );

      if (home && away) {
        const stage = detectStageFromNote(match.altGameNote);

        if (stage) {
          // Fase eliminatoria (Play-offs)
          // Buscar si hay algún partido local de la misma etapa que tenga a alguno de los dos equipos
          const localMatch = db.prepare(`
            SELECT * FROM matches 
            WHERE stage = ? AND (home_team_id = ? OR away_team_id = ? OR home_team_id = ? OR away_team_id = ?)
          `).get(stage, home.id, home.id, away.id, away.id);

          if (localMatch) {
            // Actualizar equipos locales para alinear con la realidad de internet, y cargar el marcador
            const newStatus = match.isCompleted ? 'finished' : 'pending';
            const info = db.prepare(`
              UPDATE matches 
              SET home_team_id = ?, away_team_id = ?, home_score = ?, away_score = ?, status = ?, date = 'api'
              WHERE id = ?
            `).run(home.id, away.id, match.homeScore, match.awayScore, newStatus, localMatch.id);

            if (info.changes > 0) {
              updatedCount++;
              console.log(`Playoff Alineado y Actualizado: P${localMatch.match_number} (${stage}) -> ${home.name} vs ${away.name} | Status: ${newStatus}`);
            }
          } else {
            // Si ninguno de los dos equipos estaba asignado en la BD local, buscamos algún casillero pendiente vacío
            const placeholderMatch = db.prepare(`
              SELECT * FROM matches 
              WHERE stage = ? AND status = 'pending' AND home_team_id IS NULL AND away_team_id IS NULL
              LIMIT 1
            `).get(stage);

            if (placeholderMatch) {
              const newStatus = match.isCompleted ? 'finished' : 'pending';
              const info = db.prepare(`
                UPDATE matches 
                SET home_team_id = ?, away_team_id = ?, home_score = ?, away_score = ?, status = ?, date = 'api'
                WHERE id = ?
              `).run(home.id, away.id, match.homeScore, match.awayScore, newStatus, placeholderMatch.id);

              if (info.changes > 0) {
                updatedCount++;
                console.log(`Playoff Asignado en Placeholder: P${placeholderMatch.match_number} (${stage}) -> ${home.name} vs ${away.name} | Status: ${newStatus}`);
              }
            }
          }
        } else {
          // Fase de grupos: solo actualizamos si está completado en la API
          if (match.isCompleted) {
            const info = db.prepare(`
              UPDATE matches 
              SET home_score = ?, away_score = ?, status = 'finished' 
              WHERE home_team_id = ? AND away_team_id = ?
            `).run(match.homeScore, match.awayScore, home.id, away.id);

            if (info.changes > 0) {
              updatedCount++;
              console.log(`Grupo Actualizado: ${home.name} ${match.homeScore} - ${match.awayScore} ${away.name}`);
            }
          }
        }
      }
    }
  })();

  return updatedCount;
}

// Simular la siguiente fecha o ronda (bajo demanda desde la UI)
function simulateNextMatches() {
  const pendingGroupsMatches = db.prepare(`
    SELECT * FROM matches WHERE stage = 'groups' AND status = 'pending' ORDER BY match_number ASC
  `).all();

  if (pendingGroupsMatches.length > 0) {
    // Simulamos la primera fecha disponible (24 partidos a la vez)
    const matchesToSimulate = pendingGroupsMatches.slice(0, 24);
    
    db.transaction(() => {
      for (const m of matchesToSimulate) {
        // Goles aleatorios realistas
        const homeScore = Math.floor(Math.random() * 4);
        const awayScore = Math.floor(Math.random() * 4);
        
        db.prepare(`
          UPDATE matches 
          SET home_score = ?, away_score = ?, status = 'finished' 
          WHERE id = ?
        `).run(homeScore, awayScore, m.id);
      }
    })();
    console.log(`Simulados ${matchesToSimulate.length} partidos de fase de grupos.`);
    return;
  }

  // Play-offs
  const stages = ['round_of_32', 'round_of_16', 'quarters', 'semis', 'third_place', 'final'];
  
  for (const stage of stages) {
    const pendingPlayoffMatches = db.prepare(`
      SELECT * FROM matches 
      WHERE stage = ? AND status = 'pending' AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL
    `).all();

    if (pendingPlayoffMatches.length > 0) {
      db.transaction(() => {
        for (const m of pendingPlayoffMatches) {
          let homeScore = Math.floor(Math.random() * 4);
          let awayScore = Math.floor(Math.random() * 4);
          
          if (homeScore === awayScore) {
            if (Math.random() > 0.5) homeScore += 1;
            else awayScore += 1;
          }

          db.prepare(`
            UPDATE matches 
            SET home_score = ?, away_score = ?, status = 'finished' 
            WHERE id = ?
          `).run(homeScore, awayScore, m.id);
        }
      })();
      console.log(`Simulados ${pendingPlayoffMatches.length} partidos de la fase: ${stage}.`);
      return;
    }
  }
}

module.exports = {
  syncFixture,
  simulateNextMatches
};
