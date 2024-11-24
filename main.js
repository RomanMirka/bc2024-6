const express = require('express');
const { program } = require('commander');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const upload = multer();

const app = express();

program
  .requiredOption('-h, --host <host>', 'server address')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cache>', 'directory path');

program.parse(process.argv);

const o = program.opts();

app.use(express.text());

app.get('/', (req, res) => {
  res.send('Server`s alive');
});

app.get('/notes/:name', (req, res) => {
  const NoteName = req.params.name;
  const NotePath = path.join(o.cache, `${NoteName}.txt`);
  fs.access(NotePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('Not found');
    }
    fs.readFile(NotePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).send('Error reading.');
      }
      res.send(data);
    });
  });
});

app.get('/notes', (req, res) => {
  const notesDirectory = o.cache;

  fs.readdir(notesDirectory, (err, files) => {
    if (err) {
      return res.status(500).send({ error: 'Unable to read directory' });
    }
    const NoteFiles = files.filter(file => file.endsWith('.txt'));
    const notes = [];

    if (NoteFiles.length === 0) {
      return res.status(200).json([]);
    }

    let readCount = 0;
    NoteFiles.forEach(file => {
      const FilePath = path.join(notesDirectory, file);

      fs.readFile(FilePath, 'utf8', (err, data) => {
        if (err) {
          return res.status(500).send({ error: `Error reading ${file}` });
        }

        notes.push({
          name: file.replace('.txt', ''),
          text: data,
        });

        readCount++;

        if (readCount === NoteFiles.length) {
          res.status(200).json(notes);
        }
      });
    });
  });
});

app.put('/notes/:name', express.text(), (req, res) => { 
  const NoteName = req.params.name;
  const NotePath = path.join(o.cache, `${NoteName}.txt`);

  fs.access(NotePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('Note not found');
    }

    const dataToWrite = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;

    fs.writeFile(NotePath, dataToWrite, 'utf8', (err) => {
      if (err) {
        return res.status(500).send({ error: 'Error writing note' });
      }
      res.status(200).send('Note updated successfully');
    });
  });
});

app.delete('/notes/:name', (req, res) => {
  const NoteName = req.params.name;
  const NotePath = path.join(o.cache, `${NoteName}.txt`);
  fs.access(NotePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('Not found');
    }

    fs.unlink(NotePath, (err) => {
      if (err) {
        return res.status(500).send({ error: 'Error deleting note' });
      }
      res.status(200).send('Note deleted');
    });
  });
});

app.post('/write', upload.none(), (req, res) => {
  const NoteName = req.body.note_name;
  const NoteText = req.body.note;
  const NotePath = path.join(o.cache, `${NoteName}.txt`);
  if (!NoteName || !NoteText) {
    return res.status(400).send('Error');
  }
  fs.access(NotePath, fs.constants.F_OK, (err) => {
    if (!err) {
      return res.status(400).send('Note already exists');
    }
    fs.writeFile(NotePath, NoteText, 'utf-8', (err) => {
      if (err) {
        return res.status(500).send({ error: 'Error creating the note' });
      }
      res.status(201).send('Note created successfully');
    });
  });
});

app.get('/UploadForm.html', (req, res) => {
  const FormPath = path.join(__dirname, 'UploadForm.html');
  fs.access(FormPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('UploadForm.html not found');
    }
    res.status(200).sendFile(FormPath);
  });
});

app.listen(o.port, o.host, () => {
  console.log(`Server's running at http://${o.host}:${o.port}/UploadForm.html`);
});
