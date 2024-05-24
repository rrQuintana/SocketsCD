// index.js

require('dotenv').config();
const { sendNotification } = require('./dbWatcher'); // Aquí se requiere sendNotification
require('./dbWatcher'); // Aquí se inicia la escucha de cambios en la base de datos
