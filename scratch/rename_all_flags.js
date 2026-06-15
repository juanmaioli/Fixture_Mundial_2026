const fs = require('fs');
const path = require('path');
const axios = require('axios');

const flagsDir = path.join(__dirname, '..', 'flags');
const publicFlagsDir = path.join(__dirname, '..', 'public', 'flags');

// Función para normalizar nombres (minúsculas, sin acentos ni espacios)
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres con acento
    .replace(/[\u0300-\u036f]/g, '') // Quitar diacríticos (acentos)
    .replace(/[^a-z0-9]/g, ''); // Dejar sólo letras y números
}

// Mapeos especiales manuales para banderas de tag (Reino Unido y confederaciones)
const specialMapping = {
  'waving_black_flag_tag_latin_small_letter_g_tag_latin_small_letter_b_tag_latin_small_letter_e_tag_latin_small_letter_n_tag_latin_small_letter_g_cancel_tag.png': 'inglaterra.png',
  'waving_black_flag_tag_latin_small_letter_g_tag_latin_small_letter_b_tag_latin_small_letter_s_tag_latin_small_letter_c_tag_latin_small_letter_t_cancel_tag.png': 'escocia.png',
  'waving_black_flag_tag_latin_small_letter_g_tag_latin_small_letter_b_tag_latin_small_letter_w_tag_latin_small_letter_l_tag_latin_small_letter_s_cancel_tag.png': 'gales.png',
  'regional_indicator_symbol_letter_g_regional_indicator_symbol_letter_b.png': 'reinounido.png'
};

async function renameAllFlags() {
  console.log('Descargando listado oficial de países en español de GitHub...');
  
  let countriesMap = {};
  
  try {
    const url = 'https://raw.githubusercontent.com/umpirsky/country-list/master/data/es/country.json';
    const response = await axios.get(url, { timeout: 10000 });
    countriesMap = response.data;
    console.log(`Cargados ${Object.keys(countriesMap).length} países de la base de datos de traducción.`);
  } catch (err) {
    console.error('No se pudo descargar el listado de países en español:', err.message);
    process.exit(1);
  }

  // Convertir las claves del mapa a minúsculas para coincidencia fácil
  const isoMap = {};
  for (const [code, name] of Object.entries(countriesMap)) {
    isoMap[code.toLowerCase()] = normalizeName(name);
  }

  // Sobreescribir o mapear excepciones conocidas
  isoMap['us'] = 'estadosunidos';
  isoMap['kr'] = 'coreadelsur';
  isoMap['kp'] = 'coreadelnorte';
  isoMap['cd'] = 'congord';
  isoMap['cg'] = 'congo';
  isoMap['cz'] = 'republicacheca';
  isoMap['ae'] = 'emiratosarabes';
  isoMap['za'] = 'sudafrica',
  isoMap['cv'] = 'caboverde';
  isoMap['ci'] = 'costademarfil';
  isoMap['nl'] = 'paisesbajos';
  isoMap['nz'] = 'nuevazelandia';
  isoMap['sa'] = 'arabiasaudita';

  console.log('Renombrando la totalidad de archivos de banderas...');

  const processDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    let renamedCount = 0;

    for (const file of files) {
      const oldPath = path.join(dir, file);

      // 1. Mapeo de casos especiales
      if (specialMapping[file]) {
        const newName = specialMapping[file];
        const newPath = path.join(dir, newName);
        fs.renameSync(oldPath, newPath);
        renamedCount++;
        continue;
      }

      // 2. Patrón de letras regional indicators unicode (ej: letter_a_letter_r.png)
      const match = file.match(/regional_indicator_symbol_letter_([a-z])_regional_indicator_symbol_letter_([a-z])\.png/);
      if (match) {
        const iso = match[1] + match[2];
        const countryName = isoMap[iso];

        if (countryName) {
          const newName = `${countryName}.png`;
          const newPath = path.join(dir, newName);
          
          // Si por alguna razón el archivo ya existe con ese nombre (para no pisar)
          if (!fs.existsSync(newPath)) {
            fs.renameSync(oldPath, newPath);
            renamedCount++;
          } else {
            // Si ya existe la versión renombrada, borramos la versión unicode larga vieja
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
        } else {
          console.log(`⚠️ No se encontró traducción para el código ISO: ${iso} (${file})`);
        }
      }
    }
    console.log(`Directorio [${path.basename(dir)}]: Se renombraron ${renamedCount} archivos.`);
  };

  processDirectory(flagsDir);
  processDirectory(publicFlagsDir);

  console.log('Renombrado de la totalidad de las banderas completado con éxito.');
  process.exit(0);
}

renameAllFlags();
