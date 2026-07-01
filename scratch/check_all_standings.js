const db = require('../db/connection');
const fixtureService = require('../services/fixtureService');

const standings = fixtureService.getAllStandings();
const thirds = [];

for (const g of Object.keys(standings)) {
  console.log(`\nGrupo ${g}:`);
  const list = standings[g];
  console.log(list.slice(0, 3).map((t, idx) => `  ${idx+1}. ${t.name} (Pts: ${t.points}, DG: ${t.gd}, GF: ${t.gf})`).join('\n'));
  thirds.push({ group: g, team: list[2] });
}

thirds.sort((a, b) => {
  if (b.team.points !== a.team.points) return b.team.points - a.team.points;
  if (b.team.gd !== a.team.gd) return b.team.gd - a.team.gd;
  if (b.team.gf !== a.team.gf) return b.team.gf - a.team.gf;
  return a.team.name.localeCompare(b.team.name);
});

console.log('\n--- TABLA DE TERCEROS EN BD LOCAL ---');
console.log(thirds.map((t, idx) => `${idx+1}. ${t.team.name} (Grupo ${t.group}) - Pts: ${t.team.points}, DG: ${t.team.gd}, GF: ${t.team.gf}`).join('\n'));
