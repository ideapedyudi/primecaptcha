import express from 'express';
import { generate } from '../src/index';

const app = express();
const PORT = 3000;

// Middleware to parse JSON body
app.use(express.json());

// In-memory store for captcha validation (use Redis or DB in production)
const captchaStore = new Map<string, string>();

// Simple HTML frontend to test the captcha
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PrimeCaptcha Test</title>
      <style>
        body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; margin-top: 50px; background-color: #f4f4f9; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        img { border-radius: 4px; margin-bottom: 15px; cursor: pointer; border: 1px solid #ccc; }
        input { padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 4px; margin-right: 10px; width: 120px; text-transform: uppercase;}
        button { padding: 10px 15px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px; }
        button:hover { background: #0056b3; }
        #message { margin-top: 15px; font-weight: bold; }
        .success { color: green; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>PrimeCaptcha Example</h2>
        <div style="margin-bottom: 15px;">
          <select id="captchaType" onchange="loadCaptcha()" style="padding: 5px; font-size: 16px;">
            <option value="text">Text CAPTCHA</option>
            <option value="math">Math CAPTCHA</option>
          </select>
        </div>
        <img id="captchaImage" src="" alt="Captcha Loading..." title="Click to reload" />
        <div>
          <input type="text" id="captchaInput" placeholder="Enter answer" />
          <button onclick="verifyCaptcha()">Verify</button>
        </div>
        <p id="message"></p>
      </div>

      <script>
        let currentSessionId = '';

        // Function to load a new captcha
        async function loadCaptcha() {
          const type = document.getElementById('captchaType').value;
          const res = await fetch('/api/captcha?type=' + type);
          const data = await res.json();
          currentSessionId = data.sessionId;
          // Display the base64 image
          document.getElementById('captchaImage').src = 'data:image/png;base64,' + data.image;
          document.getElementById('captchaInput').value = '';
          document.getElementById('message').innerText = '';
        }

        // Function to verify user input
        async function verifyCaptcha() {
          const input = document.getElementById('captchaInput').value;
          if (!input) {
            document.getElementById('message').innerText = 'Please enter the captcha!';
            document.getElementById('message').className = 'error';
            return;
          }

          const res = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId, userInput: input })
          });
          const result = await res.json();

          const msgEl = document.getElementById('message');
          msgEl.innerText = result.message;
          msgEl.className = result.valid ? 'success' : 'error';

          // Always reload captcha after verification attempt for security
          if (!result.valid) {
             loadCaptcha();
          }
        }

        // Reload captcha when image is clicked
        document.getElementById('captchaImage').addEventListener('click', loadCaptcha);

        // Load captcha on page load
        loadCaptcha();
      </script>
    </body>
    </html>
  `);
});

// Endpoint to generate a new captcha
app.get('/api/captcha', (req, res) => {
  const captchaType = req.query.type === 'math' ? 'math' : 'text';

  // Generate the captcha
  const captcha = generate({
    type: captchaType,
    width: 250,
    height: 80,
    length: 6,
    noiseIntensity: 6,
  });

  // Create a random session ID
  const sessionId = Math.random().toString(36).substring(2, 15);

  // Store the plaintext for validation
  captchaStore.set(sessionId, captcha.text);

  // Auto-cleanup: remove from store after 5 minutes if not verified
  setTimeout(() => {
    captchaStore.delete(sessionId);
  }, 5 * 60 * 1000);

  // Return the base64 image string and session ID
  // (In a real app, you could just send the binary buffer directly, 
  // but base64 is easier for this JSON API example)
  res.json({
    sessionId,
    image: captcha.image.toString('base64')
  });
});

// Endpoint to verify the captcha
app.post('/api/verify', (req, res) => {
  const { sessionId, userInput } = req.body;

  if (!sessionId || !userInput) {
    return res.status(400).json({ valid: false, message: 'Missing sessionId or userInput' });
  }

  const expectedText = captchaStore.get(sessionId);

  // Remove from store after attempt (prevent replay attacks)
  captchaStore.delete(sessionId);

  if (!expectedText) {
    return res.status(400).json({ valid: false, message: 'Captcha expired or invalid session' });
  }

  // Compare input (case-insensitive usually, but our alphabet is all uppercase)
  if (userInput.toUpperCase() === expectedText) {
    res.json({ valid: true, message: '✅ Captcha is correct!' });
  } else {
    res.status(400).json({ valid: false, message: '❌ Captcha is incorrect. Try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 PrimeCaptcha Example Server running at: http://localhost:${PORT}`);
  console.log(`👉 Open your browser to test the captcha visually.\n`);
});
