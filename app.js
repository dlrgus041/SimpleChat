import express from 'express';
import jade from 'jade';
        

const app = express();

app.use(express.static('public'));
app.set('view engine', 'jade');

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});

app.get('/hello', (req, res) => {
    res.render('hello');
});