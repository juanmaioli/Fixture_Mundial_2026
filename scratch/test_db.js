const db = require('../db/connection');
const fixtureService = require('../services/fixtureService');

// Simular algunos resultados para el Grupo A
// A1: Estados Unidos, A2: Marruecos, A3: Ecuador, A4: Arabia Saudita
// Partido 1: EEUU vs Marruecos -> 2-1
// Partido 2: Ecuador vs Arabia -> 1-1
db.prepare(`
  UPDATE matches 
  SET home_score = 2, away_score = 1, status = 'finished' 
  WHERE match_number = 1
`).run();

db.prepare(`
  UPDATE matches 
  SET home_score = 1, away_score = 1, status = 'finished' 
  WHERE match_number = 2
`).run();

const standings = fixtureService.getGroupStandings('A');
console.log('Standings de prueba para Grupo A:');
console.log(standings);
process.exit(0);
