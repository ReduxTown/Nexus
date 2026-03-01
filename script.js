lucide.createIcons(); // just in case

const input = document.getElementById('usernameInput');
const btn = document.getElementById('scanBtn');
const loading = document.getElementById('loading');
const errorEl = document.getElementById('error');
const result = document.getElementById('result');
const scannedName = document.getElementById('scannedName');
const robloxStatus = document.getElementById('robloxStatus');
const discordStatus = document.getElementById('discordStatus'); // static note

let lastScanTime = 0;
const RATE_LIMIT_MS = 3000; // simple client-side cooldown

btn.addEventListener('click', scan);
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') scan();
});

async function scan() {
  const username = input.value.trim();
  if (!username) return;

  const now = Date.now();
  if (now - lastScanTime < RATE_LIMIT_MS) {
    errorEl.textContent = `Wait a few seconds between scans.`;
    errorEl.classList.remove('hidden');
    setTimeout(() => errorEl.classList.add('hidden'), 3000);
    return;
  }
  lastScanTime = now;

  errorEl.classList.add('hidden');
  result.classList.add('hidden');
  loading.classList.remove('hidden');
  btn.disabled = true;

  scannedName.textContent = username;

  // Reset styles
  robloxStatus.className = '';
  robloxStatus.textContent = '';

  try {
    const len = username.length;

    // Roblox check
    let robloxMsg = '';
    let robloxClass = '';
    if (len >= 3 && len <= 20) {
      const res = await fetch(
        `https://auth.roblox.com/v1/usernames/validate?username=${encodeURIComponent(username)}&context=Signup`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (data.code === 0) {
        robloxMsg = 'Available ✓';
        robloxClass = 'available';
      } else if (data.code === 1) {
        robloxMsg = 'Taken';
        robloxClass = 'taken';
      } else if (data.code === 10) {
        robloxMsg = 'Inappropriate / invalid';
        robloxClass = 'invalid';
      } else {
        robloxMsg = data.message || 'Error';
        robloxClass = 'invalid';
      }
    } else {
      robloxMsg = 'Must be 3–20 characters';
      robloxClass = 'invalid';
    }

    robloxStatus.textContent = robloxMsg;
    robloxStatus.className = robloxClass;

  } catch (err) {
    robloxStatus.textContent = 'Check failed (network / rate limit)';
    robloxStatus.className = 'invalid';
    console.error(err);
  }

  loading.classList.add('hidden');
  result.classList.remove('hidden');
  btn.disabled = false;
}
