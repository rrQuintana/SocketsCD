// dbWatcher.js

const mongoose = require('mongoose');
const { sendNotification } = require('./server'); // Cambio aquí
require('dotenv').config();

mongoose.connect('mongodb+srv://user:hackaton@hackatonchallenge.vd8ytgi.mongodb.net/', { // Ajusta aquí la variable de entorno que contiene la cadena de conexión
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch((error) => console.error(error));

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const incidentHistorySchema = new mongoose.Schema(
  {
    id_incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    incident_files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IncidentFile",
      },
    ],
    incident_images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IncidentFile",
      },
    ],
    incident_name: {
      type: String,
      required: true,
    },
    incident_status: {
      type: Number,
      required: true,
    },
    user: {
      type:{
        name: String,
        email: String,
        phone: String,
      },
    },
    incident_description: {
      type: String,
      required: true,
    },
    incident_location: {
      type: {
        alt: Number,
        long: Number,
        municipality: String
      },
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Incident = mongoose.model('IncidentHistory', incidentHistorySchema);

Incident.watch().on('change', (change) => {
  console.log('Database change detected:', change);

  const message = {
    title: 'Database Update',
    body: 'Una ',
    timestamp: new Date().toISOString(),
  };

  sendNotification(message);
});
