const express = require('express')
const linkPreviewGenerator = require('./linkPreviewGenerator.js')
const lineByLineReader = require('line-by-line')
const app = express();
const port = 3000;
const db = require("./db");
const LOG_FILE_LOCATION = 'testong.txt'
var fs = require('fs')
var es = require('event-stream');
var cors = require('cors')



// const LOG_FILE_LOCATION = 'C:/Users/USER/AppData/Roaming/HexChat/url.log'

app.set('view engine', 'ejs');
app.use(express.static('views/assets/public'));
app.use(cors());
app.use(express.json()); //Used to parse JSON bodies


// await processLogFile();

app.get('/', async(req, res) => {

  const data = await initializePage();
  res.render('assets/index', {data:data})
  })

app.listen(port, () => {
  console.log(`anti-fomo-feed running at http://localhost:${port}`)
})

app.post('/updateLink', async(req, res) => {

  console.log(req.body)
  await updateLink(req.body.linkId, req.body.opType);
  res.end('{"success" : "Successfully updated link", "status" : 200}');
  })


async function updateLink(linkId, operationType)
{
  let query = '';
  let values = '';
  if(operationType == 'SAVE')
  {
     query = 'UPDATE links SET saved_for_later = true WHERE link_id = ($1)';
     values = [linkId];
    
  }
  if(operationType == 'DELETE')
  {
     query = 'UPDATE links SET saved_for_later = true WHERE link_id = ($1)';
     values = [linkId];
  }

  try
  {
    const queryResult = await db.query(query);
    return queryResult;
  }catch(e)
  {
    console.log(e)

  }
  
 
  
  
}
  

async function performQuery()
{

const query = 'SELECT * FROM links WHERE IORDER BY RANDOM() LIMIT 2'
// const query = 'UPDATE links SET is_viewed = true WHERE ';
// const query = 'SELECT * FROM links ORDER BY link_id LIMIT 5'

const queryResult = await db.query(query);
  return queryResult;
}

async function initializePage()
{
  let processedPreviewData = {};
  let completeLinkInfo = {};
  let previewData = [];
  let linkIdList = [];
  let queryResult = await performQuery();
  console.log(queryResult)

  for(let i =0;i<queryResult.rows.length;i++)
      {
        console.log("Processing row " + i)
         processedPreviewData[i] = await generateLinkPreview(queryResult.rows[i].link)
         completeLinkInfo[i] = 
        {
          processedPreviewData: processedPreviewData[i],
          linkId: queryResult.rows[i].link_id,
          link: queryResult.rows[i].link,
          isViewed: queryResult.rows[i].is_viewed,
          savedForLater: queryResult.rows[i].saved_for_later
        }
        previewData.push(completeLinkInfo[i]);
        linkIdList.push(queryResult.rows[i].link_id)
      }
      console.log(previewData)
      const query = 'UPDATE links SET is_viewed = true WHERE link_id = any($1)';
      // const query = 'SELECT * FROM links ORDER BY link_id LIMIT 5'

     await db.query(query, [linkIdList]);

  return previewData
}

async function generateLinkPreview(url)
{
    const previewData = await linkPreviewGenerator(url)
    return previewData;
}

async function processLogFile()
{
lr = new lineByLineReader(LOG_FILE_LOCATION, { skipEmptyLines: true});

var lineNr = 0;
lr.on('error', function (err) {
     // 'err' contains error object
});

lr.on('line', async function (line) {
    // pause emitting of lines...
    lr.pause();

    // ...do your asynchronous line processing..
    lineNr += 1;
    await insertIntoDB(line);
    console.log(lineNr + ": " + line);
    lr.resume();
});

lr.on('end', function () {
     console.log("All lines are read, file is closed now.");
});
}

 async function insertIntoDB(line)
{
  
try {

  const query = 'INSERT INTO links(link, is_viewed, saved_for_later) VALUES($1, $2, $3) ON CONFLICT (link) DO NOTHING RETURNING *'
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

