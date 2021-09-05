const express = require('express')
const linkPreviewGenerator = require('./linkPreviewGenerator.js')
const app = express();
const port = 3000;
const db = require("./db");
const LOG_FILE_LOCATION = 'testong.txt'
var previewData = [];
var fs = require('fs')
var es = require('event-stream');
var cors = require('cors')
// const LOG_FILE_LOCATION = 'C:/Users/meddie/AppData/Roaming/HexChat/url.log'

app.set('view engine', 'ejs');
app.use(express.static('views/assets/public'));
app.use(cors());

app.get('/', async (req, res) => {
  
    var processedPreviewData = (await generateLinkPreview("https://www.youtube.com/watch?v=J01rYl9T3BU"))
    console.log(processedPreviewData)
    previewData.push(processedPreviewData)
    res.render('assets/index', {previewData: previewData})
//  await processLogFile();
})

app.listen(port, () => {
  console.log(`anti-fomo-feed running at http://localhost:${port}`)
})

async function generateLinkPreview(url)
{
    const previewData = await linkPreviewGenerator(url)
    return previewData;
}

async function processLogFile()
{
  var lineNr = 0;

    var s = fs.createReadStream(LOG_FILE_LOCATION)
    .pipe(es.split())
    .pipe(es.mapSync(async function(line){

        // pause the readstream
        s.pause();

        lineNr += 1;

        await insertIntoDB(line);
        console.log(lineNr + ": " + line);
        // process line here and call s.resume() when rdy
        // function below was for logging memory usage
      


        // resume the readstream, possibly from a callback
        s.resume();
    })
    .on('error', function(err){
        console.log('Error while reading file.', err);
    })
    .on('end', function(){
        console.log('Read entire file.')
    })
);
}

 async function insertIntoDB(line)
{
  
try {

  const query = 'INSERT INTO links(link, is_viewed, saved_for_later) VALUES($1, $2, $3) RETURNING *'
  const values = [line, false,false]
  const res = await db.query(query, values)
  console.log(res.rows[0])

} catch (err) {
console.log(err.stack)
}
}

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit(1);

});

