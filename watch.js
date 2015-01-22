var watch = require('watch'),
    spawn = require('child_process').spawn,
    chalk = require('chalk'),
    log = process.stdout.write.bind(process.stdout),
    async = require('async');

var noLog = false;

function build(callback) {
  return async.series([
    function(next) {
      var build = spawn('jspm', ['bundle-sfx', 'src/main']);
      build.on('error', next);
      build.on('exit', function() {
        next(null);
      });
      build.stdout.pipe(process.stdout);
    },
    function(next) {
      var build = spawn('6to5', ['build.js', '-o', 'build.js']);
      build.on('error', next);
      build.on('exit', function() {
        next(null);
      });
      build.stdout.pipe(process.stdout);
    }
  ], callback);
}

watch.watchTree(__dirname + '/src', function(changes) {
  if(typeof changes === 'string') {
    log('File Change: ' + chalk.yellow.bold(changes) + ' Building...');
  } else {
    log('Watching ' + chalk.yellow.bold(__dirname + '/src\n\n'));
    noLog = true;
  }

  build(function(err) {
    if(noLog) return;
    if(err) {
      log('\n'+chalk.red.bold('An error occured while building\njspm bundle-sfx src/main =>\n' + err + '\n'));
    } else {
      log(chalk.green.bold('Done!\n'));
    }
  });
});