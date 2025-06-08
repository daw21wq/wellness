// Wczytaj zmienne środowiskowe z pliku .env
require('dotenv').config();

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = 4242;

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

// Ustaw domyślną strukturę bazy danych
db.defaults({ users: [] }).write();

// Serwuj pliki statyczne z głównego folderu
app.use(express.static('.'));
app.use(express.json());

// Endpoint do pobierania klucza publicznego Stripe
app.get('/config', (req, res) => {
  res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY });
});

// Endpoint do tworzenia sesji płatności Stripe
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Po udanej płatności, wróć do panelu użytkownika
      success_url: `${req.headers.origin}/user-panel.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      // W razie anulowania, wróć do strony premium
      cancel_url: `${req.headers.origin}/premium.html`,
    });

    res.json({ id: session.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    // W rzeczywistej aplikacji te dane powinny być przechowywane bezpiecznie, np. w zmiennych środowiskowych
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Nieprawidłowe dane logowania' });
    }
});

// Endpoint do zapisywania danych użytkownika
app.post('/api/user/save', (req, res) => {
    const { username, avatar, oldUsername } = req.body;

    // Prosta walidacja
    if (!username) {
        return res.status(400).json({ success: false, message: 'Nazwa użytkownika jest wymagana.' });
    }

    try {
        let user = db.get('users').find({ username: oldUsername || username }).value();

        if (user) {
            // Aktualizuj istniejącego użytkownika
            db.get('users').find({ username: oldUsername }).assign({ username, avatar: avatar || user.avatar }).write();
        } else {
            // Dodaj nowego użytkownika
             db.get('users').push({ username, avatar, isSubscribed: false, actionCount: 0 }).write();
        }
        
        res.json({ success: true, message: 'Profil zaktualizowany pomyślnie.' });
    } catch (error) {
        console.error("Błąd zapisu do bazy danych:", error);
        res.status(500).json({ success: false, message: 'Błąd serwera podczas zapisu.' });
    }
});

app.listen(PORT, () => console.log(`Serwer działa na http://localhost:${PORT}`)); 