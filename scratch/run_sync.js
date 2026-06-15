const scraper = require('../services/scraper');

async function testSync() {
  console.log('Ejecutando syncFixture()...');
  await scraper.syncFixture();
  console.log('Sincronización finalizada.');
  process.exit(0);
}

testSync();
