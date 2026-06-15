const db = require('../db/connection');

const finishedMatches = db.prepare(`
  SELECT m.*, t1.name as home_name, t2.name as away_name 
  FROM matches m
  LEFT JOIN teams t1 ON m.home_team_id = t1.id
  LEFT JOIN teams t2 ON m.away_team_id = t2.id
  WHERE m.status = 'finished'
  ORDER BY m.match_number ASC
`).all();

console.log(`Partidos finalizados en BD (${finishedMatches.length}):`);
finishedMatches.forEach(m => {
  console.log(`P${m.match_number} [${m.stage}]: ${m.home_name} ${m.home_score} - ${m.away_score} ${m.away_name}`);
});

process.exit(0);
