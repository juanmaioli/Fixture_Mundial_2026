const db = require('../db/connection');
const fixtureService = require('../services/fixtureService');

const standings = fixtureService.getAllStandings();
let errors = 0;

for (const groupName of Object.keys(standings)) {
  for (const team of standings[groupName]) {
    const expectedPoints = team.won * 3 + team.drawn * 1;
    if (team.points !== expectedPoints) {
      console.log(`❌ ERROR en ${team.name} (Grupo ${groupName}): Puntos calculados=${team.points}, Puntos esperados=${expectedPoints}`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log('✅ Todos los puntos de todas las selecciones están calculados correctamente (PTS = G*3 + E*1).');
}

process.exit(0);
