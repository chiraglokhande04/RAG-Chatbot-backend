const { spawn } = require('child_process');
const path = require('path');

function getEmbedding(text) {
  return new Promise((resolve, reject) => {
    const pyProcess = spawn('python3', [path.resolve(__dirname, 'embeddings.py'), JSON.stringify(text)]);
   

    let dataString = '';
    pyProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}`));
      } else {
        try {
          const embedding = JSON.parse(dataString);
          resolve(embedding);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}




module.exports = { getEmbedding };