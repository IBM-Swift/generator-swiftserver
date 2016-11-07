var EventEmitter = require('events');
var fs = require('fs');
var path = require('path');
var util = require('util');
var net = require('net');

module.exports = new EventEmitter
function getRandomUnusedPort(tries, avoidPort, cb) {
  if (tries <= 0) { cb(null); return; }

  var dummyServer = net.createServer();
  dummyServer.listen(0, () => {
    var port = dummyServer.address().port;
    dummyServer.close();
    if (port == avoidPort) {
      getRandomUnusedPort(tries - 1, avoidPort, cb);
      return;
    }
    cb(port);
  });
  dummyServer.on('error', (err) => { getRandomUnusedPort(tries - 1, avoidPort, cb); });
}
function exitChild(code) {
    if (swiftServerProcess) {
        swiftServerProcess.kill('SIGINT');
        console.error('kill child');
    }
    console.error('exit ' + code);
}
function handleSignal() {
    exitChild();
    process.exit(1);
}
process.on('SIGTERM', handleSignal);
process.on('SIGINT', handleSignal);
process.on('exit', exitChild);

var swiftServerProcess = null;
var projectDir = __dirname;
var sourcesDir = path.join(projectDir, 'Sources');
var mainModules = fs.readdirSync(sourcesDir)
                    .filter((file) => fs.readdirSync(path.join(sourcesDir, file)).indexOf('main.swift') != -1);
if (mainModules.length == 0) {
  console.error('Failed to find main module for project');
  process.exit(2);
} else if (mainModules.length > 1) {
  console.error('Found multiple candidates for main module in project: ' + util.inspect(mainModules));
  process.exit(2);
} else {
  // Exactly 1 main module found
  var mainModule = mainModules[0];
  var wrapperPort = process.env['PORT'];
  if (!wrapperPort) {
    console.error('Process manager did not provide a port');
    process.exit(3);
  }
  var wrapperServer = net.createServer();
  // NOTE: We call listen here rather than after the swift server
  // starts since the first listen is communicated back through the
  // cluster to the launcher. We don't want to call getRandomUnusedPort()
  // before here, since it uses listen() calls to check if a port is
  // unused.
  wrapperServer.listen(wrapperPort);
  wrapperServer.on('error', (err) => {
    console.error('Failed to start wrapper server: ' + err.stack);
    process.exit(5);
  });
  getRandomUnusedPort(10, wrapperPort, (swiftServerPort) => {
    if (!swiftServerPort) {
      console.error('Failed to find unused port for swift server');
      process.exit(4);
    }

    console.error('Starting Swift server');
    var appCommand = path.join(projectDir, '.build', 'debug', mainModule);
    process.env['PORT'] = swiftServerPort;
    var options = { cwd: projectDir, detached: false, stdio: 'inherit' };
    swiftServerProcess = require('child_process').spawn(appCommand, [], options);
    swiftServerProcess.on('error', (err) => {
      console.error('Failed to start Swift server: ' + err.stack);
      process.exit(6);
    });
    swiftServerProcess.on('exit', (code, signal) => {
      console.error('Swift Server exited (code: ' + code + ', signal: ' + signal + ')');
      process.exit(7);
    });
    wrapperServer.on('connection', (socket) => {
      var serverConnection = net.createConnection(swiftServerPort)
      socket.pipe(serverConnection);
      serverConnection.pipe(socket);
    });
    module.exports.emit('started');
  });
}
