const express = require('express');
const app = express();
const path = require('path');

// 👉 Middleware (DESPUÉS de crear app)
app.use(express.json());

// 👉 Firebase
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// 👇 PONLO AQUÍ
console.log("Firebase cargado:", process.env.FIREBASE_KEY ? "SI" : "NO");


const db = admin.firestore();


// 👉 Servir frontend
app.use(express.static(path.join(__dirname, 'public')));

// 👉 RUTA PRINCIPAL (opcional pero útil)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 👉 API RUEDA
app.post('/jugar', async (req, res) => {
  try {
    const { cedula } = req.body;

    if (!cedula) {
      return res.status(400).json({ error: 'Cédula requerida' });
    }

    // 🔍 Verificar si ya jugó
    // 🔍 Verificar si ya jugó (más rápido y mejor)
const docRef = db.collection('jugadores').doc(cedula);
const doc = await docRef.get();

if (doc.exists) {
  return res.json({ mensaje: 'Ya participaste' });
}

    // 🔢 CONTADOR GLOBAL
    const contadorRef = db.collection('config').doc('contador');
    const contadorDoc = await contadorRef.get();

    let contador = 0;

    if (contadorDoc.exists) {
      contador = contadorDoc.data().valor;
    }

    contador++;

    // 🎁 PREMIOS
    const premios = [
      
      "💸 50% de descuento",
      "💸 30% de descuento",
      "💸 20% de descuento",
      "🍹 Bebida gratis"
    ];

    let premio;

    // 🎯 Cada 15 → boleto GRATIS
    if (contador % 15 === 0) {
      premio = "🎟️ BOLETO GRATIS";
    } else {
      const random = Math.floor(Math.random() * premios.length);
      premio = premios[random];
    }

    // 💾 Guardar jugador
    await db.collection('jugadores').doc(cedula).set({
  cedula,
  premio,
  fecha: new Date()
});

    // 💾 Actualizar contador
    await contadorRef.set({ valor: contador });

   res.json({
  premio
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// 👉 SERVIDOR
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🎉 Euforia funcionando en http://localhost:${PORT}`);
});
