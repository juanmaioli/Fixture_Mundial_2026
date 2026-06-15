const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'espn_api_completo.json');
const rawData = fs.readFileSync(jsonPath);
const data = JSON.parse(rawData);

const teamsByGroup = {};
const allTeams = new Set();

data.events.forEach(event => {
  const comp = event.competitions[0];
  const note = comp.altGameNote || ''; // Ej: "FIFA World Cup, Group A"
  
  if (note.includes('Group')) {
    const groupMatch = note.match(/Group\s+([A-L])/i);
    const groupName = groupMatch ? groupMatch[1].toUpperCase() : 'Unknown';
    
    if (!teamsByGroup[groupName]) {
      teamsByGroup[groupName] = new Set();
    }
    
    comp.competitors.forEach(c => {
      const teamName = c.team.displayName;
      const teamAbbr = c.team.abbreviation;
      const teamLogo = c.team.logo;
      teamsByGroup[groupName].add(`${teamName} (${teamAbbr})`);
      allTeams.add(teamName);
    });
  }
});

console.log('Equipos reales por grupo en la API de ESPN:');
for (const g of Object.keys(teamsByGroup).sort()) {
  console.log(`Grupo ${g}:`, Array.from(teamsByGroup[g]));
}
console.log(`Total equipos únicos detectados: ${allTeams.size}`);
process.exit(0);
