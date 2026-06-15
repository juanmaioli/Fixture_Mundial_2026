const fs = require('fs');
const path = require('path');
const axios = require('axios');

const flagsDir = path.join(__dirname, '..', 'flags');
const publicFlagsDir = path.join(__dirname, '..', 'public', 'flags');

// Mapeo de códigos de 2 letras ISO a nombres de países normalizados (minúsculas, sin espacios ni caracteres especiales)
const isoToCountry = {
  'mx': 'mexico',
  'za': 'sudafrica',
  'kr': 'coreadelsur',
  'cz': 'republicacheca',
  'ca': 'canada',
  'ba': 'bosniaherzegovina',
  'qa': 'catar',
  'ch': 'suiza',
  'br': 'brasil',
  'ma': 'marruecos',
  'ht': 'haiti',
  'us': 'estadosunidos',
  'py': 'paraguay',
  'au': 'australia',
  'tr': 'turquia',
  'de': 'alemania',
  'cw': 'curazao',
  'ci': 'costademarfil',
  'ec': 'ecuador',
  'nl': 'paisesbajos',
  'jp': 'japon',
  'se': 'suecia',
  'tn': 'tunez',
  'be': 'belgica',
  'eg': 'egipto',
  'ir': 'iran',
  'nz': 'nuevazelandia',
  'es': 'espana',
  'cv': 'caboverde',
  'sa': 'arabiasaudita',
  'uy': 'uruguay',
  'fr': 'francia',
  'sn': 'senegal',
  'iq': 'irak',
  'no': 'noruega',
  'ar': 'argentina',
  'dz': 'argelia',
  'at': 'austria',
  'jo': 'jordania',
  'pt': 'portugal',
  'cd': 'congord',
  'uz': 'uzbekistan',
  'co': 'colombia',
  'hr': 'croacia',
  'gh': 'ghana',
  'pa': 'panama'
};

// Mapeo para nombres de archivos especiales (tag flags de Twemoji)
const specialMapping = {
  // Inglaterra (gbeng)
  'waving_black_flag_tag_latin_small_letter_g_tag_latin_small_letter_b_tag_latin_small_letter_e_tag_latin_small_letter_n_tag_latin_small_letter_g_cancel_tag.png': 'inglaterra.png',
  // Escocia (gbsct)
  'waving_black_flag_tag_latin_small_letter_g_tag_latin_small_letter_b_tag_latin_small_letter_s_tag_latin_small_letter_c_tag_latin_small_letter_t_cancel_tag.png': 'escocia.png',
  // Gales (gbwls)
  'waving_black_flag_tag_latin_small_letter_g_tag_latin_small_letter_b_tag_latin_small_letter_w_tag_latin_small_letter_l_tag_latin_small_letter_s_cancel_tag.png': 'gales.png'
};

// Códigos ISO para los 48 equipos de nuestro Mundial para descargarlos de backup si faltan
const worldCupTeamsIso = {
  'mexico': 'mx', 'sudafrica': 'za', 'coreadelsur': 'kr', 'republicacheca': 'cz',
  'canada': 'ca', 'bosniaherzegovina': 'ba', 'catar': 'qa', 'suiza': 'ch',
  'brasil': 'br', 'marruecos': 'ma', 'haiti': 'ht', 'escocia': 'gb-sct',
  'estadosunidos': 'us', 'paraguay': 'py', 'australia': 'au', 'turquia': 'tr',
  'alemania': 'de', 'curazao': 'cw', 'costademarfil': 'ci', 'ecuador': 'ec',
  'paisesbajos': 'nl', 'japon': 'jp', 'suecia': 'se', 'tunez': 'tn',
  'belgica': 'be', 'egipto': 'eg', 'iran': 'ir', 'nuevazelandia': 'nz',
  'espana': 'es', 'caboverde': 'cv', 'arabiasaudita': 'sa', 'uruguay': 'uy',
  'francia': 'fr', 'senegal': 'sn', 'irak': 'iq', 'noruega': 'no',
  'argentina': 'ar', 'argelia': 'dz', 'austria': 'at', 'jordania': 'jo',
  'portugal': 'pt', 'congord': 'cd', 'uzbekistan': 'uz', 'colombia': 'co',
  'inglaterra': 'gb-eng', 'croacia': 'hr', 'ghana': 'gh', 'panama': 'pa'
};

// Función para descargar una bandera de backup
async function downloadBackupFlag(countryName, iso) {
  let url = `https://flagcdn.com/w80/${iso}.png`;
  if (iso === 'gb-sct') url = 'https://flagcdn.com/w80/gb-sct.png';
  if (iso === 'gb-eng') url = 'https://flagcdn.com/w80/gb-eng.png';

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    fs.writeFileSync(path.join(flagsDir, `${countryName}.png`), response.data);
    fs.writeFileSync(path.join(publicFlagsDir, `${countryName}.png`), response.data);
    console.log(`📥 Bandera descargada de backup: ${countryName}.png (${iso})`);
  } catch (err) {
    console.error(`❌ Error al descargar bandera de backup para ${countryName} (${iso}):`, err.message);
  }
}

async function renameAndNormalize() {
  console.log('Renombrando y normalizando imágenes de banderas...');

  // Crear directorios si no existen
  if (!fs.existsSync(flagsDir)) fs.mkdirSync(flagsDir, { recursive: true });
  if (!fs.existsSync(publicFlagsDir)) fs.mkdirSync(publicFlagsDir, { recursive: true });

  // 1. Procesar banderas de ./flags original
  const files = fs.readdirSync(flagsDir);

  for (const file of files) {
    const oldPath = path.join(flagsDir, file);
    const oldPublicPath = path.join(publicFlagsDir, file);

    // Si es un archivo especial (Inglaterra, Escocia, Gales)
    if (specialMapping[file]) {
      const newName = specialMapping[file];
      fs.copyFileSync(oldPath, path.join(flagsDir, newName));
      fs.copyFileSync(oldPath, path.join(publicFlagsDir, newName));
      
      // Borrar los viejos
      try { fs.unlinkSync(oldPath); } catch (_) {}
      try { fs.unlinkSync(oldPublicPath); } catch (_) {}
      console.log(`🔄 Renombrado especial: ${file} -> ${newName}`);
      continue;
    }

    // Comprobar patrón de letras regional indicators
    const match = file.match(/regional_indicator_symbol_letter_([a-z])_regional_indicator_symbol_letter_([a-z])\.png/);
    if (match) {
      const iso = match[1] + match[2];
      const countryName = isoToCountry[iso];

      if (countryName) {
        const newName = `${countryName}.png`;
        fs.copyFileSync(oldPath, path.join(flagsDir, newName));
        fs.copyFileSync(oldPath, path.join(publicFlagsDir, newName));
        
        // Borrar los viejos
        try { fs.unlinkSync(oldPath); } catch (_) {}
        try { fs.unlinkSync(oldPublicPath); } catch (_) {}
        console.log(`🔄 Renombrado: ${file} -> ${newName}`);
      }
    }
  }

  // 2. Asegurarse de que los 48 equipos de nuestro Mundial tengan su bandera
  console.log('Verificando si faltan banderas para las 48 selecciones...');
  for (const country of Object.keys(worldCupTeamsIso)) {
    const flagPath = path.join(publicFlagsDir, `${country}.png`);
    if (!fs.existsSync(flagPath)) {
      console.log(`⚠️ Falta la bandera para: ${country}. Descargando...`);
      await downloadBackupFlag(country, worldCupTeamsIso[country]);
    }
  }

  console.log('Proceso de renombrado y descarga de banderas finalizado.');
  process.exit(0);
}

renameAndNormalize();
