const spawn = require('child_process').spawn;
const path = require('path');
const temp = require('temp');
const fs = require('fs');

temp.track();

module.exports = (inputPath, outputPath, options) => {
  options = options || {};

  return new Promise((resolve, reject) => {
    try {
      const tempDir = temp.mkdirSync('node-kindlegen');
      const ePubFilename = 'input.epub';
      const mobiFilename = 'output.mobi';

      fs.copyFileSync(inputPath, path.join(tempDir, ePubFilename));

      const args = [ePubFilename, '-o', mobiFilename];

      if (Array.isArray(options.kindlegenArgs)) {
        args.push(...options.kindlegenArgs);
      }

      const kindlegen = spawn(
        binaryPath(),
        args,
        {
          cwd: tempDir,
          env: {},
        },
      );

      if (typeof options.stdout === 'function') {
        kindlegen.stdout.on('data', options.stdout);
      }

      if (typeof options.stderr === 'function') {
        kindlegen.stderr.on('data', options.stderr);
      }

      kindlegen.on('close', (exitCode) => {
        // kindlegen exits with status 1 for warnings, and 2 for errors
        if (exitCode !== 0 && exitCode !== 1) {
          return reject(new Error(`kindlegen exited with status ${exitCode}`));
        }

        fs.copyFileSync(path.join(tempDir, mobiFilename), outputPath);
        resolve(outputPath);
      });

    } catch (error) {
      reject(error);
    }
  });
}

function binaryPath() {
  switch (process.platform) {
    case 'darwin':
      return path.resolve(__dirname, 'binaries/kindlegen-macos-x64');
    case 'linux':
      return path.resolve(__dirname, 'binaries/kindlegen-linux-x86');
    case 'win32':
      return path.resolve(__dirname, 'binaries/kindlegen-win-x64');
    default:
      throw new Error('Unsupported platform: ' + process.platform);
  }
}
