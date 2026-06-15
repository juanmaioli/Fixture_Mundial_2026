const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const fixtureService = require('../services/fixtureService');
const scraper = require('../services/scraper');

// Página principal: muestra todo el fixture, tablas y play-offs
router.get('/', (req, res) => {
  try {
    const standings = fixtureService.getAllStandings();
    
    // Obtener todos los partidos de fase de grupos
    const groupMatches = db.prepare(`
      SELECT m.*, t1.name as home_name, t1.flag_file as home_flag, t2.name as away_name, t2.flag_file as away_flag
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.stage = 'groups'
      ORDER BY m.match_number ASC
    `).all();

    // Agrupar partidos por grupo
    const matchesByGroup = {};
    groupMatches.forEach(m => {
      if (!matchesByGroup[m.group_name]) {
        matchesByGroup[m.group_name] = [];
      }
      matchesByGroup[m.group_name].push(m);
    });

    // Obtener partidos de play-offs
    const playoffMatches = db.prepare(`
      SELECT m.*, 
             t1.name as home_name, t1.flag_file as home_flag, 
             t2.name as away_name, t2.flag_file as away_flag
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.stage != 'groups'
      ORDER BY m.match_number ASC
    `).all();

    // Agrupar play-offs por ronda
    const playoffsByStage = {
      round_of_32: playoffMatches.filter(m => m.stage === 'round_of_32'),
      round_of_16: playoffMatches.filter(m => m.stage === 'round_of_16'),
      quarters: playoffMatches.filter(m => m.stage === 'quarters'),
      semis: playoffMatches.filter(m => m.stage === 'semis'),
      third_place: playoffMatches.filter(m => m.stage === 'third_place'),
      final: playoffMatches.filter(m => m.stage === 'final')
    };

    // Obtener estadísticas rápidas
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as played,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM matches
    `).get();

    res.render('index', {
      standings,
      matchesByGroup,
      playoffsByStage,
      stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor al cargar el fixture.');
  }
});

// Sincronizar y actualizar resultados (solo scraping real)
router.post('/sync', async (req, res) => {
  try {
    await scraper.syncFixture();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error durante la sincronización de datos.');
  }
});


// Actualizar un partido individualmente (carga manual de goles)
router.post('/matches/update', (req, res) => {
  try {
    const { match_id, home_score, away_score, status } = req.body;
    
    // Si status es 'finished', guardamos los goles. Si es 'pending', los dejamos nulos
    if (status === 'finished') {
      const hScore = parseInt(home_score, 10);
      const aScore = parseInt(away_score, 10);
      
      if (!isNaN(hScore) && !isNaN(aScore)) {
        db.prepare(`
          UPDATE matches 
          SET home_score = ?, away_score = ?, status = 'finished' 
          WHERE id = ?
        `).run(hScore, aScore, match_id);
      }
    } else {
      db.prepare(`
        UPDATE matches 
        SET home_score = NULL, away_score = NULL, status = 'pending' 
        WHERE id = ?
      `).run(match_id);
    }

    // Recalcular play-offs
    fixtureService.updatePlayoffBracket();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar el partido.');
  }
});

// Reiniciar fixture a cero
router.post('/reset', (req, res) => {
  try {
    db.transaction(() => {
      // Poner resultados a nulo
      db.prepare(`
        UPDATE matches 
        SET home_score = NULL, away_score = NULL, status = 'pending'
      `).run();

      // Limpiar clasificados de play-off (ponerlos a nulo)
      db.prepare(`
        UPDATE matches 
        SET home_team_id = NULL, away_team_id = NULL 
        WHERE stage != 'groups'
      `).run();
    })();

    console.log('Fixture reiniciado correctamente.');
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al reiniciar el fixture.');
  }
});

module.exports = router;
