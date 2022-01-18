// Importowanie bibliotek
const http = require('http');
const express = require('express');
const session = require('express-session');
const mariadb = require('mariadb');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const path = require('path');
const { workers } = require('cluster');
const { apply } = require('body-parser');
// Inicjacja aplikacji
const app = express();
app.use(express.json())
app.use(express.static("express"))
app.use(express.static(path.join(__dirname,'public')));
app.set('view engine','ejs');
app.use(session({
    secret: 'bc03d7c13c6ecb3bc1983f2de8e99dc16a0376ee4a1ee62f48ce9fe4c79b4eac',
    resave: true,
    saveUninitialized: true,
    cookie: { expires: new Date(Date.now()+3600000), maxAge: 3600000 }
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const pool = mariadb.createPool({
    host: 'srv07.mikr.us',
    user: 'bikemania-test',
    password: 'JoLJCXG54R7*aXQ7',
    database: 'bikemania_test',
    port: 20362,
    rowsAsArray: true
});
// Po inicjacji przechodzę do generowania widoków stron
app.get('/', (req,res) => {
    res.render('pages/index');
    console.log('Strona index została wyświetlona');
});
app.get('/aktualnosci', (req,res) => {
    res.render('pages/aktualnosci');
    console.log('Strona aktualnosci została wyświetlona');
});
app.get('/cennik', (req,res) => {
    res.render('pages/cennik');
    console.log('Strona cennik została wyświetlona');
});
app.get('/kontakt', (req,res) => {
    res.render('pages/kontakt');
    console.log('Strona kontakt została wyświetlona');
});
app.get('/rezerwacje', (req,res) => {
    res.render('pages/rezerwacje');
    console.log('Strona rezerwacje została wyświetlona');
})
app.post('/register_user', (req, res)=>{
    //formular do rejestracji
    var sql = "insert into uzytkownicy values(null, '"+ req.body.imie +"', '"+ req.body.nazwisko +"', "+ req.body.telefon +", "+ req.body.pesel +", '"+ req.body.nr_dowodu +"')";
    pool.query(sql, (err) => {
        if (err) throw err
        res.render('pages/podsumowanie');
        console.log('Strona register_user została wyświetlona');
    })

})
    

app.get('/serwis', (req,res) => {
    res.render('pages/serwis');
    console.log('Strona serwis została wyświetlona');
});
app.get('/podsumowanie', (req,res) => {
    //wyciąganie danych do podsumowania po rezerwacji
    pool.query('select * from uzytkownicy', (err, rows, fields)=> {
    if(err) throw err
        res.render('pages/podsumowanie', {title:"User Details", items: rows});
        console.log('Strona podsumowanie została wyświetlona');
    })
});
// Konfiguracja serwera
const server = http.createServer(app);
const port = 30362;
/*
 * Ustawiam na port 30362, na potrzeby wyświetlenia strony.
 * Port może być dowolny - ważne aby stronę podłączyć pod właściwy port.
 */
server.listen(port);
console.log('Serwer słucha na porcie '+port);

//Zapytania MySQL

