const express = require('express');
const app = express();
const path = require('path');

// 👉 Middleware
app.use(express.json());

// =========================
// 🔥 FIREBASE CONFIG
// =========================
const admin = require('firebase-admin');

let serviceAccount;

try {
  if (process.env.FIREBASE_KEY) {
    // 👉 PRODUCCIÓN (Render)
    serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    console.log("🔥 Firebase desde RENDER");
  } else {
    // 👉 LOCAL
    serviceAccount = require('./firebase-key.json');
    console.log("🔥 Firebase desde LOCAL");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

} catch (error) {
  console.error("❌ Error cargando Firebase:", error);
}

const db = admin.firestore();

// =========================
// 🌐 FRONTEND
// =========================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =========================
// 🎯 API RULETA
// =========================
app.post('/jugar', async (req, res) => {
  try {
    const { cedula } = req.body;

    if (!cedula) {
      return res.status(400).json({ error: 'Cédula requerida' });
    }

    // 🔍 Verificar si ya jugó
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
      contador = contadorDoc.data().valor || 0;
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

    // 🎉 RESPUESTA
    return res.json({ premio });

  } catch (error) {
    console.error("❌ Error en /jugar:", error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// =========================
// 🚀 SERVIDOR
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🎉 Euforia funcionando en puerto ${PORT}`);
});