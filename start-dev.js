const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting GrooveNomad development environment...\n');

// Start Better Auth server
console.log('📡 Starting Better Auth server on port 3000...');
const authServer = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

  // Wait a bit for the auth server to start
  setTimeout(() => {
    console.log('\n📱 Starting Expo development server...');
    const expoServer = spawn('pnpm', ['expo', 'start'], {
      stdio: 'inherit',
      cwd: __dirname
    });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    authServer.kill();
    expoServer.kill();
    process.exit(0);
  });

  expoServer.on('close', (code) => {
    console.log(`\n📱 Expo server exited with code ${code}`);
    authServer.kill();
    process.exit(code);
  });
}, 2000);

authServer.on('close', (code) => {
  console.log(`\n📡 Auth server exited with code ${code}`);
  process.exit(code);
});

console.log('💡 Press Ctrl+C to stop both servers\n'); 