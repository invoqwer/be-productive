const express = require('express')
const app = express()
app.set('view engine', 'pug')
app.set('views', './views')
app.use(express.static(__dirname + '/public'));
const port = process.env.port || 3000

app.get('/', function (req, res) {
  res.render('index')
})

app.listen(port, () => 
  console.log(`Be Productive => http://127.0.0.1:${port}!`)
)