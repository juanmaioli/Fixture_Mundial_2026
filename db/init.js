const fs = require('fs');
const path = require('path');
const db = require('./connection');

console.log('Inicializando base de datos real con datos del JSON de ESPN...');

// Crear tablas
db.exec(`
  DROP TABLE IF EXISTS matches;
  DROP TABLE IF EXISTS teams;

  CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    group_name TEXT NOT NULL,
    flag_file TEXT NOT NULL
  );

  CREATE TABLE matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_team_id INTEGER,
    away_team_id INTEGER,
    home_score INTEGER,
    away_score INTEGER,
    date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    stage TEXT NOT NULL,
    group_name TEXT,
    placeholder_home TEXT,
    placeholder_away TEXT,
    match_number INTEGER UNIQUE,
    FOREIGN KEY (home_team_id) REFERENCES teams (id),
    FOREIGN KEY (away_team_id) REFERENCES teams (id)
  );
`);

// Diccionario de traducción de nombres de ESPN a español de Argentina
const translateName = {
  'Mexico': 'México',
  'South Africa': 'Sudáfrica',
  'South Korea': 'Corea del Sur',
  'Czechia': 'República Checa',
  'Canada': 'Canadá',
  'Bosnia-Herzegovina': 'Bosnia-Herzegovina',
  'Qatar': 'Catar',
  'Switzerland': 'Suiza',
  'Brazil': 'Brasil',
  'Morocco': 'Marruecos',
  'Haiti': 'Haití',
  'Scotland': 'Escocia',
  'United States': 'Estados Unidos',
  'Paraguay': 'Paraguay',
  'Australia': 'Australia',
  'Türkiye': 'Turquía',
  'Germany': 'Alemania',
  'Curaçao': 'Curazao',
  'Ivory Coast': 'Costa de Marfil',
  'Ecuador': 'Ecuador',
  'Netherlands': 'Países Bajos',
  'Japan': 'Japón',
  'Sweden': 'Suecia',
  'Tunisia': 'Túnez',
  'Belgium': 'Bélgica',
  'Egypt': 'Egipto',
  'Iran': 'Irán',
  'New Zealand': 'Nueva Zelanda',
  'Spain': 'España',
  'Cape Verde': 'Cabo Verde',
  'Saudi Arabia': 'Arabia Saudita',
  'Uruguay': 'Uruguay',
  'France': 'Francia',
  'Senegal': 'Senegal',
  'Iraq': 'Irak',
  'Norway': 'Noruega',
  'Argentina': 'Argentina',
  'Algeria': 'Argelia',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Portugal': 'Portugal',
  'Congo DR': 'Congo RD',
  'Uzbekistan': 'Uzbekistán',
  'Colombia': 'Colombia',
  'England': 'Inglaterra',
  'Croatia': 'Croacia',
  'Ghana': 'Ghana',
  'Panama': 'Panamá'
};

// Diccionario de abreviatura de 3 letras de ESPN al archivo de bandera renombrado local
const flagMapping = {
  'MEX': 'mexico.png',
  'RSA': 'sudafrica.png',
  'KOR': 'coreadelsur.png',
  'CZE': 'republicacheca.png',
  'CAN': 'canada.png',
  'BIH': 'bosniaherzegovina.png',
  'QAT': 'catar.png',
  'SUI': 'suiza.png',
  'BRA': 'brasil.png',
  'MAR': 'marruecos.png',
  'HAI': 'haiti.png',
  'SCO': 'escocia.png',
  'USA': 'estadosunidos.png',
  'PAR': 'paraguay.png',
  'AUS': 'australia.png',
  'TUR': 'turquia.png',
  'GER': 'alemania.png',
  'CUW': 'curazao.png',
  'CIV': 'costademarfil.png',
  'ECU': 'ecuador.png',
  'NED': 'paisesbajos.png',
  'JPN': 'japon.png',
  'SWE': 'suecia.png',
  'TUN': 'tunez.png',
  'BEL': 'belgica.png',
  'EGY': 'egipto.png',
  'IRN': 'iran.png',
  'NZL': 'nuevazelandia.png',
  'ESP': 'espana.png',
  'CPV': 'caboverde.png',
  'KSA': 'arabiasaudita.png',
  'URU': 'uruguay.png',
  'FRA': 'francia.png',
  'SEN': 'senegal.png',
  'IRQ': 'irak.png',
  'NOR': 'noruega.png',
  'ARG': 'argentina.png',
  'ALG': 'argelia.png',
  'AUT': 'austria.png',
  'JOR': 'jordania.png',
  'POR': 'portugal.png',
  'COD': 'congord.png',
  'UZB': 'uzbekistan.png',
  'COL': 'colombia.png',
  'ENG': 'inglaterra.png',
  'CRO': 'croacia.png',
  'GHA': 'ghana.png',
  'PAN': 'panama.png'
};

// Leer el JSON completo
const jsonPath = path.join(__dirname, '..', 'scratch', 'espn_api_completo.json');
const rawData = fs.readFileSync(jsonPath);
const data = JSON.parse(rawData);

// 1. Extraer selecciones y guardarlas
const teamsLoaded = {}; // Map name -> db_id

const insertTeam = db.prepare(`
  INSERT INTO teams (name, code, group_name, flag_file)
  VALUES (?, ?, ?, ?)
`);

db.transaction(() => {
  data.events.forEach(event => {
    const comp = event.competitions[0];
    const note = comp.altGameNote || '';
    
    if (note.includes('Group')) {
      const groupMatch = note.match(/Group\s+([A-L])/i);
      const groupName = groupMatch ? groupMatch[1].toUpperCase() : 'Unknown';
      
      comp.competitors.forEach(c => {
        const rawName = c.team.displayName;
        const code = c.team.abbreviation;
        const nameEsp = translateName[rawName] || rawName;
        const flagFile = flagMapping[code] || 'waving_white_flag.png';
        
        if (!teamsLoaded[rawName]) {
          try {
            const result = insertTeam.run(nameEsp, code, groupName, flagFile);
            teamsLoaded[rawName] = result.lastInsertRowid;
          } catch (err) {
            // Ya cargado
          }
        }
      });
    }
  });
})();

console.log('Equipos reales cargados en BD.');

// Recargar los IDs desde la BD para asegurar correspondencia
const teamsInDb = db.prepare('SELECT * FROM teams').all();
const teamMap = {}; // code -> db_id
teamsInDb.forEach(t => {
  teamMap[t.code] = t.id;
});

// 2. Insertar partidos reales de Fase de Grupos
const insertMatch = db.prepare(`
  INSERT INTO matches (home_team_id, away_team_id, stage, group_name, match_number)
  VALUES (?, ?, 'groups', ?, ?)
`);

let matchNum = 1;
db.transaction(() => {
  data.events.forEach(event => {
    const comp = event.competitions[0];
    const note = comp.altGameNote || '';
    
    if (note.includes('Group')) {
      const groupMatch = note.match(/Group\s+([A-L])/i);
      const groupName = groupMatch ? groupMatch[1].toUpperCase() : 'Unknown';
      
      const homeComp = comp.competitors.find(c => c.homeAway === 'home');
      const awayComp = comp.competitors.find(c => c.homeAway === 'away');
      
      if (homeComp && awayComp) {
        const homeId = teamMap[homeComp.team.abbreviation];
        const awayId = teamMap[awayComp.team.abbreviation];
        
        insertMatch.run(homeId, awayId, groupName, matchNum++);
      }
    }
  });
})();

console.log(`Cargados ${matchNum - 1} partidos reales de fase de grupos.`);

// 3. Pre-generar los 32 partidos de eliminación directa
const insertPlayoffMatch = db.prepare(`
  INSERT INTO matches (stage, match_number, placeholder_home, placeholder_away)
  VALUES (?, ?, ?, ?)
`);

db.transaction(() => {
  const r32Pairings = [
    { home: '1A', away: '3° C/D/E/F' },
    { home: '2A', away: '2B' },
    { home: '1B', away: '3° A/C/D/E' },
    { home: '2C', away: '2D' },
    { home: '1C', away: '3° A/B/E/F' },
    { home: '1D', away: '3° B/C/F/G' },
    { home: '1E', away: '2F' },
    { home: '1F', away: '2E' },
    { home: '1G', away: '3° H/I/J/K' },
    { home: '2G', away: '2H' },
    { home: '1H', away: '3° G/I/J/K' },
    { home: '2I', away: '2J' },
    { home: '1I', away: '3° G/H/K/L' },
    { home: '1J', away: '3° H/I/L/A' },
    { home: '1K', away: '2L' },
    { home: '1L', away: '2K' }
  ];

  r32Pairings.forEach((p, idx) => {
    insertPlayoffMatch.run('round_of_32', matchNum++, p.home, p.away);
  });

  for (let i = 1; i <= 8; i++) {
    insertPlayoffMatch.run('round_of_16', matchNum++, `Ganador P${72 + (i*2 - 1)}`, `Ganador P${72 + (i*2)}`);
  }

  for (let i = 1; i <= 4; i++) {
    insertPlayoffMatch.run('quarters', matchNum++, `Ganador P${88 + (i*2 - 1)}`, `Ganador P${88 + (i*2)}`);
  }

  insertPlayoffMatch.run('semis', matchNum++, 'Ganador P97', 'Ganador P98');
  insertPlayoffMatch.run('semis', matchNum++, 'Ganador P99', 'Ganador P100');

  insertPlayoffMatch.run('third_place', matchNum++, 'Perdedor P101', 'Perdedor P102');
  insertPlayoffMatch.run('final', matchNum++, 'Ganador P101', 'Ganador P102');
})();

console.log('Fixture de play-offs pre-generado.');
console.log('Inicialización de base de datos REAL completada con éxito.');
process.exit(0);
