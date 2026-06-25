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

  const updateHomeTeam = (matchNum, team) => {
    db.prepare(`
      UPDATE matches 
      SET home_team_id = ? 
      WHERE match_number = ?
    `).run(team ? team.id : null, matchNum);
  };

  const updateAwayTeam = (matchNum, team) => {
    db.prepare(`
      UPDATE matches 
      SET away_team_id = ? 
      WHERE match_number = ?
    `).run(team ? team.id : null, matchNum);
  };

  db.transaction(() => {
    // 1. Procesar grupos finalizados individualmente
    for (const g of Object.keys(standings)) {
      const isGroupFinished = db.prepare(`
        SELECT COUNT(*) as count FROM matches 
        WHERE stage = 'groups' AND group_name = ? AND status = 'finished'
      `).get(g).count === 6;

      if (isGroupFinished) {
        const first = standings[g][0];
        const second = standings[g][1];

        switch (g) {
          case 'A':
            updateHomeTeam(73, first);
            updateHomeTeam(74, second);
            break;
          case 'B':
            updateHomeTeam(75, first);
            updateAwayTeam(74, second);
            break;
          case 'C':
            updateHomeTeam(77, first);
            updateHomeTeam(76, second);
            break;
          case 'D':
            updateHomeTeam(78, first);
            updateAwayTeam(76, second);
            break;
          case 'E':
            updateHomeTeam(79, first);
            updateAwayTeam(80, second);
            break;
          case 'F':
            updateHomeTeam(80, first);
            updateAwayTeam(79, second);
            break;
          case 'G':
            updateHomeTeam(81, first);
            updateHomeTeam(82, second);
            break;
          case 'H':
            updateHomeTeam(83, first);
            updateAwayTeam(82, second);
            break;
          case 'I':
            updateHomeTeam(85, first);
            updateHomeTeam(84, second);
            break;
          case 'J':
            updateHomeTeam(86, first);
            updateAwayTeam(84, second);
            break;
          case 'K':
            updateHomeTeam(87, first);
            updateAwayTeam(88, second);
            break;
          case 'L':
            updateHomeTeam(88, first);
            updateAwayTeam(87, second);
            break;
        }
      } else {
        // Si el grupo no está finalizado, nos aseguramos de vaciar sus placeholders
        switch (g) {
          case 'A':
            updateHomeTeam(73, null);
            updateHomeTeam(74, null);
            break;
          case 'B':
            updateHomeTeam(75, null);
            updateAwayTeam(74, null);
            break;
          case 'C':
            updateHomeTeam(77, null);
            updateHomeTeam(76, null);
            break;
          case 'D':
            updateHomeTeam(78, null);
            updateAwayTeam(76, null);
            break;
          case 'E':
            updateHomeTeam(79, null);
            updateAwayTeam(80, null);
            break;
          case 'F':
            updateHomeTeam(80, null);
            updateAwayTeam(79, null);
            break;
          case 'G':
            updateHomeTeam(81, null);
            updateHomeTeam(82, null);
            break;
          case 'H':
            updateHomeTeam(83, null);
            updateAwayTeam(82, null);
            break;
          case 'I':
            updateHomeTeam(85, null);
            updateHomeTeam(84, null);
            break;
          case 'J':
            updateHomeTeam(86, null);
            updateAwayTeam(84, null);
            break;
          case 'K':
            updateHomeTeam(87, null);
            updateAwayTeam(88, null);
            break;
          case 'L':
            updateHomeTeam(88, null);
            updateAwayTeam(87, null);
            break;
        }
      }
    }

    // 2. Si los 12 grupos están completos, calculamos y asignamos los mejores terceros
    if (finishedGroupsCount === 12) {
      const thirds = [];
      for (const g of Object.keys(standings)) {
        thirds.push({ group: g, team: standings[g][2] });
      }

      // Ordenar los mejores terceros: puntos, dif gol, goles favor
      thirds.sort((a, b) => {
        if (b.team.points !== a.team.points) return b.team.points - a.team.points;
        if (b.team.gd !== a.team.gd) return b.team.gd - a.team.gd;
        if (b.team.gf !== a.team.gf) return b.team.gf - a.team.gf;
        return a.team.name.localeCompare(b.team.name);
      });

      const bestThirds = thirds.slice(0, 8); // Tomamos los 8 mejores terceros

      // Asignar los mejores terceros a las llaves correspondientes
      updateAwayTeam(73, bestThirds[0].team);
      updateAwayTeam(75, bestThirds[1].team);
      updateAwayTeam(77, bestThirds[2].team);
      updateAwayTeam(78, bestThirds[3].team);
      updateAwayTeam(81, bestThirds[4].team);
      updateAwayTeam(83, bestThirds[5].team);
      updateAwayTeam(85, bestThirds[6].team);
      updateAwayTeam(86, bestThirds[7].team);
    } else {
      // Si falta algún grupo, limpiamos los terceros
      updateAwayTeam(73, null);
      updateAwayTeam(75, null);
      updateAwayTeam(77, null);
      updateAwayTeam(78, null);
      updateAwayTeam(81, null);
      updateAwayTeam(83, null);
      updateAwayTeam(85, null);
      updateAwayTeam(86, null);
    }
  })();

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
