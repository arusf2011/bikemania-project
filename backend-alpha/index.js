// Importowanie bibliotek
const http = require('http');
const express = require('express');
const session = require('express-session');
const mariadb = require('mariadb');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const path = require('path');
const { count } = require('console');
const { check, validationResult } = require('express-validator');
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
    host: 'xxxxxx',
    user: 'xxxxxxx',
    password: 'xxxxxxx',
    database: 'xxxxxx',
    port: 0,
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
    if(req.session.error != '')
    {
        error_msg = req.session.error;
        req.session.error = '';
        res.render('pages/rezerwacje',{
            error: error_msg
        });
    }
    else
    {
        res.render('pages/rezerwacje',{
            error: ''
        });
    }
    console.log('Strona rezerwacje została wyświetlona');
});
app.post('/auth_user',(req,res)=> {
    nazwisko = req.body.nazwisko;
    konc_tel = "%"+req.body.konc_tel;
    konc_pesel = "%"+req.body.konc_pesel;
    pool.getConnection()
        .then((conn) => {
            conn.query('SELECT id_uzytkownika FROM uzytkownicy WHERE nazwisko = ? AND numer_telefonu LIKE ? AND pesel LIKE ?',[nazwisko,konc_tel,konc_pesel])
                .then((rows) => {
                    console.log(rows.length);
                    if(rows.length == 1)
                    {
                        req.session.loggedIn = true;
                        req.session.id_uzytkownika = rows
                        res.redirect('/nowa_rezerwacja');
                    }
                    else
                    {
                        req.session.error = 'Nie ma takiego konta! Aby skorzystać z naszego serwisu, zarejestruj się! :)';
                        res.redirect('/rezerwacje');
                    }
                })
                .catch(err => {console.log(err)})
        })
        .catch(err => {console.log(err)})
});
app.get('/nowa_rezerwacja',(req,res) => {
    if(req.session.loggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT * FROM rowery JOIN wypozyczenia ON rowery.id_roweru = wypozyczenia.id_roweru WHERE wypozyczenia.data_rozpoczecia > NOW() AND wypozyczenia.data_zakonczenia < NOW()')
                    .then((rows) => {

                    })
                    .catch(err => { console.log(err); })
            })
            .catch(err => { console.log(err); })
        res.render('pages/nowa_rezerwacja')
    }
    else
    {
        res.redirect('/rezerwacje');
    }
});
app.get('/serwis', (req,res) => {
    res.render('pages/serwis');
    console.log('Strona serwis została wyświetlona');
});
app.get('/podsumowanie_rezerwacja', (req,res) => {
    res.render('pages/rezerwacja_podsumowanie');
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
app.get('/admin_login',(req,res) => {
    if(req.session.errors != '')
    {
        errors_arr = req.session.errors;
        req.session.errors = '';
        res.render('pages/admin_login',{
            errors: errors_arr
        });

    }
});
app.post('/auth_admin',[
    check('nazwa_uzytkownika')
        .equals("admin")
        .withMessage('Nieprawidłowa nazwa użytkownika'),
    check('password')
        .equals('xxxxxx')
        .withMessage('Nieprawidłowe hasło')
],(req,res) => {
    const errors = validationResult(req);
    if(errors.isEmpty())
    {
        req.session.adminLoggedIn = true;
        res.redirect('/admin_dash');
    }
    else
    {
        req.session.errors = errors.mapped();
        res.redirect('/admin_login');
    }
});
app.get('/admin_logout',(req,res) => {
    req.session.adminLoggedIn = false;
    res.redirect('/');
});
app.get('/admin_dash',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        res.render('pages/admin_dash');
    }
    else
    {
        res.redirect('/admin_login',{
            errors: ''
        });
    }
});
app.post('/anuluj_rezerwacje',(req,res) => {
    id_wypozyczenia = req.body.id_wypozyczenia;
    pool.getConnection()
        .then((conn) => {
            conn.query('DELETE FROM wypozyczenia WHERE id = ?',id_wypozyczenia)
                .then((rows) => {
                    req.session.anuluj_wypozyczenie = true;
                    res.redirect('/admin_dash');
                })
                .catch(err => { console.log(err); })
        })
        .catch(err => { console.log(err); })
});
app.post('/zakonczenie_wynajmu',(req,res) => {

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

