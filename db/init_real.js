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

// Diccionario de abreviatura de 3 letras de ESPN al archivo de bandera local de 2 letras
const flagMapping = {
  'MEX': 'regional_indicator_symbol_letter_m_regional_indicator_symbol_letter_x.png',
  'RSA': 'regional_indicator_symbol_letter_z_regional_indicator_symbol_letter_a.png',
  'KOR': 'regional_indicator_symbol_letter_k_regional_indicator_symbol_letter_r.png',
  'CZE': 'regional_indicator_symbol_letter_c_regional_indicator_symbol_letter_z.png',
  'CAN': 'regional_indicator_symbol_letter_c_regional_indicator_symbol_letter_a.png',
  'BIH': 'regional_indicator_symbol_letter_b_regional_indicator_symbol_letter_a.png',
  'QAT': 'regional_indicator_symbol_letter_q_regional_indicator_symbol_letter_a.png',
  'SUI': 'regional_indicator_symbol_letter_c_regional_indicator_symbol_letter_h.png',
  'BRA': 'regional_indicator_symbol_letter_b_regional_indicator_symbol_letter_r.png',
  'MAR': 'regional_indicator_symbol_letter_m_regional_indicator_symbol_letter_a.png',
  'HAI': 'regional_indicator_symbol_letter_h_regional_indicator_symbol_letter_t.png',
  'SCO': 'waving_black_flag_tag_latin_small_letter_g_tag_latin_small_letter_b_tag_latin_small_letter_s_tag_latin_small_letter_c_tag_latin_small_letter_t_cancel_tag.png',
  'USA': 'regional_indicator_symbol_letter_u_regional_indicator_symbol_letter_s.png',
  'PAR': 'regional_indicator_symbol_letter_p_regional_indicator_symbol_letter_y.png',
  'AUS': 'regional_indicator_symbol_letter_a_regional_indicator_symbol_letter_u.png',
  'TUR': 'regional_indicator_symbol_letter_t_regional_indicator_symbol_letter_r.png',
  'GER': 'regional_indicator_symbol_letter_d_regional_indicator_symbol_letter_e.png',
  'CUW': 'regional_indicator_symbol_letter_c_regional_indicator_symbol_letter_w.png',
  'CIV': 'regional_indicator_symbol_letter_c_regional_indicator_symbol_letter_i.png',
  'ECU': 'regional_indicator_symbol_letter_e_regional_indicator_symbol_letter_c.png',
  'NED': 'regional_indicator_symbol_letter_n_regional_indicator_symbol_letter_l.png',
  'JPN': 'regional_indicator_symbol_letter_j_regional_indicator_symbol_letter_p.png',
  'SWE': 'regional_indicator_symbol_letter_s_regional_indicator_symbol_letter_e.png',
  'TUN': 'regional_indicator_symbol_letter_t_regional_indicator_symbol_letter_n.png',
  'BEL': 'regional_indicator_symbol_letter_b_regional_indicator_symbol_letter_e.png',
  'EGY': 'regional_indicator_symbol_letter_e_regional_indicator_symbol_letter_g.png',
  'IRN': 'regional_indicator_symbol_letter_i_regional_indicator_symbol_letter_r.png',
  'NZL': 'regional_indicator_symbol_letter_n_regional_indicator_symbol_letter_z.png',
  'ESP': 'regional_indicator_symbol_letter_e_regional_indicator_symbol_letter_s.png',
  'CPV': 'regional_indicator_symbol_letter_c_regional_indicator_symbol_letter_v.png',
  'KSA': 'regional_indicator_symbol_letter_s_regional_indicator_symbol_letter_a.png',
  'URU': 'regional_indicator_symbol_letter_u_regional_indicator_symbol_letter_y.png',
  'FRA': 'regional_indicator_symbol_letter_f_regional_indicator_symbol_letter_r.png',
  'SEN': 'regional_indicator_symbol_letter_s_regional_indicator_symbol_letter_n.png',
  'IRQ': 'regional_indicator_symbol_letter_i_regional_indicator_symbol_letter_q.png',
  'NOR': 'regional_indicator_symbol_letter_n_regional_indicator_symbol_letter_o.png',
  'ARG': 'regional_indicator_symbol_letter_a_regional_indicator_symbol_letter_r.png',
  'ALG': 'regional_indicator_symbol_letter_d_regional_indicator_symbol_letter_z.png',
  'AUT': 'regional_indicator_symbol_letter_a_regional_indicator_symbol_letter_t.png',
  'JOR': 'regional_indicator_symbol_letter_j_regional_indicator_symbol_letter_o.png',
  'POR': 'regional_indicator_symbol_letter_p_regional_indicator_symbol_letter_t.png',
  'COD': 'regional_indicator_symbol_letter_c_regional_indicator_symbol_letter_d.png',
  'UZB': 'regional_indicator_symbol_letter_u_regional_indicator_symbol_letter_z.png',
  'COL': 'regional_indicator_symbol_letter_c_regional_indicator_symbol_letter_o.png',
  'ENG': 'waving_black_flag_tag_latin_small_letter_g_tag_latin_small_letter_b_tag_latin_small_letter_e_tag_latin_small_letter_n_tag_latin_small_letter_g_cancel_tag.png',
  'CRO': 'regional_indicator_symbol_letter_h_regional_indicator_symbol_letter_r.png',
  'GHA': 'regional_indicator_symbol_letter_g_regional_indicator_symbol_letter_h.png',
  'PAN': 'regional_indicator_symbol_letter_p_regional_indicator_symbol_letter_a.png'
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
