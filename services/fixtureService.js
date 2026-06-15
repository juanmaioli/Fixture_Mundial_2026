const db = require('../db/connection');

// Calcular la tabla de posiciones para un grupo específico
function getGroupStandings(groupName) {
  const teams = db.prepare('SELECT * FROM teams WHERE group_name = ?').all(groupName);
  
  const standings = teams.map(team => {
    return {
      id: team.id,
      name: team.name,
      code: team.code,
      flag_file: team.flag_file,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    };
  });

  const matches = db.prepare(`
    SELECT * FROM matches 
    WHERE stage = 'groups' AND group_name = ? AND status = 'finished'
  `).all(groupName);

  for (const match of matches) {
    const home = standings.find(t => t.id === match.home_team_id);
    const away = standings.find(t => t.id === match.away_team_id);

    if (home && away && match.home_score !== null && match.away_score !== null && !isNaN(match.home_score) && !isNaN(match.away_score)) {
      home.played += 1;
      away.played += 1;
      home.gf += match.home_score;
      home.ga += match.away_score;
      away.gf += match.away_score;
      away.ga += match.home_score;

      if (match.home_score > match.away_score) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (match.home_score < match.away_score) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    }
  }

  // Calcular diferencia de gol
  standings.forEach(t => {
    t.gd = t.gf - t.ga;
  });

  // Ordenar standings: puntos, diferencia de gol, goles a favor, y alfabético
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  return standings;
}

// Obtener todas las tablas de posiciones
function getAllStandings() {
  const alphabet = 'ABCDEFGHIJKL'.split('');
  const allStandings = {};
  for (const char of alphabet) {
    allStandings[char] = getGroupStandings(char);
  }
  return allStandings;
}

// Actualizar llaves de eliminación directa según el estado actual de los partidos
function updatePlayoffBracket() {
  const standings = getAllStandings();
  const finishedGroupsCount = Object.keys(standings).filter(g => {
    // Un grupo está completo si se jugaron los 6 partidos
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM matches 
      WHERE stage = 'groups' AND group_name = ? AND status = 'finished'
    `).get(g).count;
    return count === 6;
  }).length;

  // Si todos los grupos de la fase de grupos terminaron (12 grupos)
  if (finishedGroupsCount === 12) {
    const firsts = [];
    const seconds = [];
    const thirds = [];

    for (const g of Object.keys(standings)) {
      const list = standings[g];
      firsts.push({ group: g, team: list[0] });
      seconds.push({ group: g, team: list[1] });
      thirds.push({ group: g, team: list[2] });
    }

    // Ordenar los mejores terceros: puntos, dif gol, goles favor
    thirds.sort((a, b) => {
      if (b.team.points !== a.team.points) return b.team.points - a.team.points;
      if (b.team.gd !== a.team.gd) return b.team.gd - a.team.gd;
      if (b.team.gf !== a.team.gf) return b.team.gf - a.team.gf;
      return a.team.name.localeCompare(b.team.name);
    });

    const bestThirds = thirds.slice(0, 8); // Tomamos los 8 mejores terceros

    // Asignación de 16avos de final
    // Cruces definidos en db/init.js:
    // match_number 73: 1A vs 3° C/D/E/F
    // match_number 74: 2A vs 2B
    // match_number 75: 1B vs 3° A/C/D/E
    // match_number 76: 2C vs 2D
    // match_number 77: 1C vs 3° A/B/E/F
    // match_number 78: 1D vs 3° B/C/F/G
    // match_number 79: 1E vs 2F
    // match_number 80: 1F vs 2E
    // match_number 81: 1G vs 3° H/I/J/K
    // match_number 82: 2G vs 2H
    // match_number 83: 1H vs 3° G/I/J/K
    // match_number 84: 2I vs 2J
    // match_number 85: 1I vs 3° G/H/K/L
    // match_number 86: 1J vs 3° H/I/L/A
    // match_number 87: 1K vs 2L
    // match_number 88: 1L vs 2K

    const getTeamByCode = (group, pos) => {
      // pos: 0 = 1ro, 1 = 2do
      return standings[group][pos];
    };

    // Mapear cruces
    const updateMatchTeams = (matchNum, homeTeam, awayTeam) => {
      db.prepare(`
        UPDATE matches 
        SET home_team_id = ?, away_team_id = ? 
        WHERE match_number = ?
      `).run(homeTeam.id, awayTeam.id, matchNum);
    };

    // Asignación de terceros usando los 8 clasificados ordenadamente
    updateMatchTeams(73, getTeamByCode('A', 0), bestThirds[0].team);
    updateMatchTeams(74, getTeamByCode('A', 1), getTeamByCode('B', 1));
    updateMatchTeams(75, getTeamByCode('B', 0), bestThirds[1].team);
    updateMatchTeams(76, getTeamByCode('C', 1), getTeamByCode('D', 1));
    updateMatchTeams(77, getTeamByCode('C', 0), bestThirds[2].team);
    updateMatchTeams(78, getTeamByCode('D', 0), bestThirds[3].team);
    updateMatchTeams(79, getTeamByCode('E', 0), getTeamByCode('F', 1));
    updateMatchTeams(80, getTeamByCode('F', 0), getTeamByCode('E', 1));
    updateMatchTeams(81, getTeamByCode('G', 0), bestThirds[4].team);
    updateMatchTeams(82, getTeamByCode('G', 1), getTeamByCode('H', 1));
    updateMatchTeams(83, getTeamByCode('H', 0), bestThirds[5].team);
    updateMatchTeams(84, getTeamByCode('I', 1), getTeamByCode('J', 1));
    updateMatchTeams(85, getTeamByCode('I', 0), bestThirds[6].team);
    updateMatchTeams(86, getTeamByCode('J', 0), bestThirds[7].team);
    updateMatchTeams(87, getTeamByCode('K', 0), getTeamByCode('L', 1));
    updateMatchTeams(88, getTeamByCode('L', 0), getTeamByCode('K', 1));
  }

  // Ahora procesar las rondas eliminatorias subsiguientes
  // Si los partidos de la ronda de 32 están finalizados, avanzamos a octavos de final (match_numbers 89 a 96)
  processNextStage('round_of_32', 'round_of_16', 73, 89);
  processNextStage('round_of_16', 'quarters', 89, 97);
  processNextStage('quarters', 'semis', 97, 101);
  processNextStageSemisAndFinals();
}

// Lógica genérica para avanzar ganadores a la siguiente ronda
function processNextStage(currentStage, nextStage, currentStartMatchNum, nextStartMatchNum) {
  const matches = db.prepare(`
    SELECT * FROM matches WHERE stage = ? ORDER BY match_number ASC
  `).all(currentStage);

  for (let i = 0; i < matches.length; i += 2) {
    const m1 = matches[i];
    const m2 = matches[i + 1];

    if (m1 && m2) {
      const nextMatchNum = nextStartMatchNum + Math.floor(i / 2);
      const winner1Id = getMatchWinner(m1);
      const winner2Id = getMatchWinner(m2);

      db.prepare(`
        UPDATE matches 
        SET home_team_id = ?, away_team_id = ? 
        WHERE match_number = ?
      `).run(winner1Id, winner2Id, nextMatchNum);
    }
  }
}

function processNextStageSemisAndFinals() {
  const semi1 = db.prepare('SELECT * FROM matches WHERE match_number = 101').get();
  const semi2 = db.prepare('SELECT * FROM matches WHERE match_number = 102').get();

  if (semi1 && semi2) {
    const winner1 = getMatchWinner(semi1);
    const loser1 = getMatchLoser(semi1);
    const winner2 = getMatchWinner(semi2);
    const loser2 = getMatchLoser(semi2);

    // Final (104)
    db.prepare(`
      UPDATE matches SET home_team_id = ?, away_team_id = ? WHERE match_number = 104
    `).run(winner1, winner2);

    // Tercer puesto (103)
    db.prepare(`
      UPDATE matches SET home_team_id = ?, away_team_id = ? WHERE match_number = 103
    `).run(loser1, loser2);
  }
}

function getMatchWinner(match) {
  if (match.status !== 'finished') return null;
  if (match.home_score > match.away_score) return match.home_team_id;
  if (match.away_score > match.home_score) return match.away_team_id;
  // En fase eliminatoria no hay empates, asumimos definición por penales y guardamos
  // el ganador según un desempate simulado o la BD (por simplicidad, si es empate
  // tomamos al local, pero en play-offs le daremos la victoria a uno si el scraper trae empate).
  return match.home_team_id;
}

function getMatchLoser(match) {
  if (match.status !== 'finished') return null;
  if (match.home_score > match.away_score) return match.away_team_id;
  if (match.away_score > match.home_score) return match.home_team_id;
  return match.away_team_id;
}

module.exports = {
  getAllStandings,
  getGroupStandings,
  updatePlayoffBracket
};
