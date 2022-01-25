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
    host: 'xxxxx',
    user: 'xxxxx',
    password: 'xxxxx',
    database: 'xxxxx',
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
            error: error_msg,
            succ: ''
        });
    }
    else if(req.session.success != '')
    {
        succ_msg = req.session.success;
        req.session.success = '';
        res.render('pages/rezerwacje',{
            error: '',
            succ: succ_msg
        });
    }
    else
    {
        res.render('pages/rezerwacje',{
            error: '',
            succ: ''
        });
    }
    console.log('Strona rezerwacje została wyświetlona');
});
app.post('/register_user',(req,res) => {
    nazwisko = req.body.nazwisko;
    imie = req.body.imie;
    telefon = req.body.telefon;
    pesel = req.body.pesel;
    nr_dowodu = req.body.nr_dowodu;
    pool.getConnection()
        .then((conn) => {
            conn.query('INSERT INTO uzytkownicy VALUES(NULL,?,?,?,?,?)',[imie,nazwisko,telefon,pesel,nr_dowodu])
            .then((rows) => {
                req.session.success = 'Konto zostało utworzone! Możesz przejść do logowania!';
                res.redirect('/rezerwacje');
                conn.end();
            })
            .catch(err => { console.log(err); });
            conn.end();
        })
        .catch(err => { console.log(err); });
});
app.post('/auth_user',[
    check('konc_tel')
        .isNumeric()
        .isLength(4)
        .notEmpty()
        .withMessage('Końcówka telefonu jest za krótka (wymagane są 3 cyfry)'),
    check('konc_pesel')
        .toInt()
        .isLength(3)
        .notEmpty()
        .withMessage('Końcówka PESELU jest za krótka (wymagane są 4 cyfry)'),
    check('nazwisko')
        .isString()
        .notEmpty()
        .escape()
        .withMessage('Nazwisko jest puste lub nie jest tekstem')
],(req,res)=> {
    const errors = validationResult(req);
    if(errors.isEmpty())
    {
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
                            req.session.id_uzytkownika = rows[0][0]
                            res.redirect('/nowa_rezerwacja');
                            conn.end();
                        }
                        else
                        {
                            req.session.error = 'Nie ma takiego konta! Aby skorzystać z naszego serwisu, zarejestruj się! :)';
                            res.redirect('/rezerwacje');
                            conn.end();
                        }
                    })
                    .catch(err => {console.log(err)})
                    conn.end();
            })
            .catch(err => {console.log(err)})
    }
    else
    {
        req.session.error = errors.mapped();
        res.redirect('/rezerwacje');
    }
});
app.get('/nowa_rezerwacja',(req,res) => {
    if(req.session.loggedIn)
    {
        res.render('pages/nowa_rezerwacja');
    }
    else
    {
        res.redirect('/rezerwacje');
    }
});
app.post('/api_rowery',(req,res) => {
    start_data = req.body.start_data;
    end_data = req.body.end_data;
    pool.getConnection()
        .then((conn) => {
            conn.query('SELECT DISTINCT rowery.id_roweru as id_roweru, model, typ_roweru FROM rowery LEFT JOIN wypozyczenia ON rowery.id_roweru = wypozyczenia.id_roweru WHERE ((wypozyczenia.data_zakonczenia < ? OR wypozyczenia.data_rozpoczecia > ?) AND (wypozyczenia.data_zakonczenia < ? OR wypozyczenia.data_rozpoczecia > ?)) OR wypozyczenia.id_roweru IS null',[start_data,start_data,end_data,end_data])
                .then((rows) => {
                    res.render('pages/ls_rowery',{
                        rowery: rows
                    });
                    conn.end();
                })
                .catch(err => { console.log(err); });
        })
        .catch(err => { console.log(err); });
})
app.post('/nowa_rezerwacja',(req,res) => {
    if(req.session.loggedIn)
    {
        data_start = new Date(Date.parse(req.body.data_start));
        data_koniec = new Date(Date.parse(req.body.data_koniec));
        rower = req.body.rower;
        cennik = req.body.cennik;
        id_uzytkownika = req.session.id_uzytkownika;
        pool.getConnection()
            .then((conn) => {
                conn.query('INSERT INTO wypozyczenia VALUES(null,?,?,?,?,0,?,null,1,null)',[rower,id_uzytkownika,data_start,data_koniec,cennik])
                    .then((result) => {
                        req.session.data_start = data_start;
                        req.session.data_koniec = data_koniec;
                        req.session.rower = rower;
                        req.session.cennik = cennik;
                        req.session.id_rezerwacji = result.insertId;
                        res.redirect('/podsumowanie_rezerwacja');
                    })
                    .catch(err => { console.log(err); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/rezerwacje');
    }
});
app.get('/aktualnosci',(req,res) => {
    if(req.session.loggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT * FROM aktualnosci')
                    .then((rows) => {
                        res.render('pages/aktualnosci',{
                            aktual: rows
                        });
                    })
                    .catch(err => { console.log(err); })
            })
            .catch(err => { console.log(err); })
    }
    else
    {
        res.redirect('/aktualnosci');
    }
});
app.get('/serwis', (req,res) => {
    res.render('pages/serwis');
    console.log('Strona serwis została wyświetlona');
});
app.get('/podsumowanie_rezerwacja', (req,res) => {
    var cennik_txt = '';
    if(req.session.cennik == 1)
    {
        cennik_txt = 'Abonament dzienny';
    }
    else if(req.session.cennik == 2)
    {
        cennik_txt = 'Cennik minutowy';
    }
    else if(req.session.cennik == 3)
    {
        cennik_txt = 'Cennik kilometrowy';
    }
    else if(req.session.cennik == 4)
    {
        cennik_txt = 'Abonament miesięczny';
    }
    console.log(cennik_txt);
    pool.getConnection()
        .then((conn) => {
            conn.query('SELECT model, typ_roweru FROM rowery WHERE id_roweru = ?',req.session.rower)
                .then((rows) => {
                    res.render('pages/podsumowanie',{
                        rower: rows[0][0]+' - '+rows[0][1],
                        cennik: cennik_txt,
                        data_start: req.session.data_start,
                        data_koniec: req.session.data_koniec,
                        id: req.session.id_rezerwacji
                    });
                    console.log('Strona serwis została wyświetlona');
                    conn.end();
                })
                .catch(err => { console.log(err); });
                conn.end();
        })
        .catch(err => { console.log(err); });
});
app.get('/admin_login',(req,res) => {
    if(req.session.errors != ' ')
    {
        errors_arr = req.session.errors;
        req.session.errors = ' ';
        res.render('pages/admin_login',{
            errors: errors_arr
        });

    }
    else
    {
        res.render('pages/admin_login',{
            errors: ' '
        })
    }
});
app.post('/auth_admin',[
    check('nazwa_uzytkownika')
        .equals("admin")
        .withMessage('Nieprawidłowa nazwa użytkownika'),
    check('haslo')
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
        if(req.session.anuluj_wypozyczenie == true)
        {
            succ = "Wynajem numer "+req.session.id_wypozyczenia+" zostało anulowane!";
            req.session.anuluj_wypozyczenie = null;
            req.session.id_wypozyczenia = null;
            res.render('pages/admin_dash',{
                success: succ,
                id_wypozyczenia: 0
            });
        }
        else if(req.session.rozpoczecie_wynajmu == true)
        {
            succ = "Wynajem numer "+req.session.id_wypozyczenia+" zostało rozpoczęte!";
            req.session.rozpoczecie_wynajmu = null;
            req.session.id_wypozyczenia = null;
            res.render('pages/admin_dash',{
                success: succ,
                id_wypozyczenia: 0
            });
        }
        else if(req.session.oplacenie_wynajmu == true)
        {
            succ = "Wynajem numer "+req.session.id_wypozyczenia+" zostało opłacone!";
            req.session.rozpoczecie_wynajmu = null;
            req.session.id_wypozyczenia = null;
            res.render('pages/admin_dash',{
                success: succ,
                id_wypozyczenia: 0
            });
        }

        // to do

        else if(req.session.opublikowanie_aktualnosci == true)
        {
            succ = "Aktualność "+req.session.tytul_aktualnosci+" została opublikowana!";
            req.session.opublikowanie_aktualnosci = null;
            req.session.tytul_aktualnosci = null;
            req.session.autor_aktualnosci = null;
            req.session.tresc_aktualnosci = null;           
            res.render('pages/admin_dash',{
                success: succ,
                tytul_aktualnosci: 0,
                autor_aktualnosci: 0,
                tresc_aktualnosci: 0
            });
        }
        else if(req.session.zakonczenie_wynajmu != '')
        {
            if(req.session.id_wypozyczenia != null)
            {
                succ = req.session.zakonczenie_wynajmu;
                id_w = req.session.id_wypozyczenia;
                req.session.zakonczenie_wynajmu = null;
                req.session.id_wypozyczenia = null;
                res.render('pages/admin_dash',{
                    success: succ,
                    id_wypozyczenia: id_w
                });
            }
            else
            {
                succ = req.session.zakonczenie_wynajmu;
                req.session.zakonczenie_wynajmu = null;
                res.render('pages/admin_dash',{
                    success: succ,
                    id_wypozyczenia: 0
                });
            }

            }
        else
        {
            res.render('pages/admin_dash',{
                success: '',
                id_wypozyczenia: 0
            });
        }
    }
    else
    {
        res.redirect('/admin_login');
    }
});
app.post('/rozpoczecie_wynajmu',(req,res) => {
    id_wypozyczenia = req.body.id_wypozyczenia;
    pool.getConnection()
        .then((conn) => {
            conn.query('UPDATE wypozyczenia SET data_rozpoczecia = NOW() WHERE id = ?',id_wypozyczenia)
                .then((rows) => {
                    req.session.rozpoczecie_wynajmu = true;
                    req.session.id_wypozyczenia = id_wypozyczenia;
                    res.redirect('/admin_dash');
                    conn.end();
                })
                .catch(err => { console.log(err); })
                conn.end();
        })
        .catch(err => { console.log(err); })
});
app.post('/anuluj_rezerwacje',(req,res) => {
    id_wypozyczenia = req.body.id_wypozyczenia;
    pool.getConnection()
        .then((conn) => {
            conn.query('DELETE FROM wypozyczenia WHERE id = ?',id_wypozyczenia)
                .then((rows) => {
                    req.session.anuluj_wypozyczenie = true;
                    res.redirect('/admin_dash');
                    conn.end();
                })
                .catch(err => { console.log(err); });
                conn.end();
        })
        .catch(err => { console.log(err); })
});
app.post('/oplac_wynajem',(req,res) => {
    id_wypozyczenia = req.body.id_wypozyczenia;
    metoda = req.body.metoda;
    pool.getConnection()
        .then((conn) => {
            conn.query('UPDATE wypozyczenia SET platnosc = ? WHERE id = ?',[metoda,id_wypozyczenia])
                .then((rows) => {
                    req.session.oplacenie_wynajmu = true;
                    req.session.id_wypozyczenia = id_wypozyczenia;
                    res.redirect('/admin_dash');
                    conn.end();
                })
                .catch(err => { console.log(err); });
                conn.end();
        })
        .catch(err => { console.log(err); });

});
app.post('/opublikowanie_aktualnosci',(req,res) => {
    tytul = req.body.tytul_aktualnosci;
    autor = req.body.autor_aktualnosci;
    tresc = req.body.tresc_aktualnosci;
    pool.getConnection()
        .then((conn) => {
            conn.query('INSERT INTO aktualnosci VALUES(NULL,?,?,?,NOW())',[tytul,autor,tresc])
            .then((rows) => {
                res.redirect('/aktualnosci');
            })
            .catch(err => { console.log(err); });
            conn.end();
        })
        .catch(err => { console.log(err); });
});
app.post('/zakonczenie_wynajmu',(req,res) => {
    id_wypozyczenia = req.body.id_wypozyczenia;
    przejechane_kilometry = req.body.przejechane_kilometry;
    koszt = 0;
    pool.getConnection()
        .then((conn) => {
            conn.query('SELECT * FROM wypozyczenia JOIN rowery ON wypozyczenia.id_roweru = rowery.id_roweru WHERE id_wypozyczenia = ?',id_wypozyczenia)
                .then((rows) => {
                    if(rows[0][6] == 1 || rows[0][6] == 4)
                    {
                        switch(rows[0][6])
                        {
                            case 1:
                                pool.getConnection()
                                    .then((conn2) => {
                                        conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 0, platnosc = "abonament całodniowy" WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony i opłacony. (abonament całodniowy)";
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                    })
                                    .catch(err => { console.log(err); });
                                break;
                            case 4:
                                pool.getConnection()
                                    .then((conn2) => {
                                        conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 0, platnosc = "abonament miesięczny" WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony i opłacony. (abonament miesięczny)";
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                    })
                                    .catch(err => { console.log(err); });
                                break;
                            default:
                                break;
                        }
                        
                    }
                    else if(rows[0][6] == 2)
                    {
                        data_rozpoczecia = rows[0][3].getTime();
                        var now = new Date.getTime();
                        var distance = now - data_rozpoczecia;
                        var hours = Math.floor((distance % (1000 * 60 * 60 * 24))/-(1000 * 60 * 60));
                        var minutes = Math.floor((distance % (1000 * 60 * 60))/-(1000 * 60));
                        if(hours == 0 && minutes < 15)
                        {
                            pool.getConnection()
                                .then((conn2) => {
                                    conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 0, platnosc = "voucher" WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                        .then((rows1) => {
                                            req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony i opłacony. (bezpłatny przejazd do 15 minut)";
                                            res.redirect('/admin_dash');
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                        conn2.end();
                                        conn.end();
                                })
                                .catch(err => { console.log(err); });
                        }
                        else if((hours == 1 && minutes == 0) || (minutes >= 15 && hours < 1))
                        {
                            switch(rows[0][11])
                            {
                                case 'elektryczny':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 10 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                                .then((rows1) => {
                                                    req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 10 zł.";
                                                    req.session.id_wypozyczenia = id_wypozyczenia;
                                                    res.redirect('/admin_dash');
                                                    conn2.end();
                                                    conn.end();
                                                })
                                                .catch(err => { console.log(err); });
                                                conn2.end();
                                                conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'szosowy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 5 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 5 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'miejski':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 5 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 5 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'dziecięcy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 3 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 3 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                default:
                                    break;
                            }
                        }
                        else if((hours == 2 && minutes == 0) || (minutes > 0 && hours == 1))
                        {
                            switch(rows[0][11])
                            {
                                case 'elektryczny':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 17 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 17 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'szosowy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 9 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 9 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'miejski':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 9 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 9 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'dziecięcy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 6 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 6 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                default:
                                    break;
                            }
                        }
                        else if((hours == 3 && minutes == 0) || (minutes > 0 && hours == 2))
                        {
                            switch(rows[0][11])
                            {
                                case 'elektryczny':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 24 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 24 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'szosowy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 13 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 13 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'miejski':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 13 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 13 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'dziecięcy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 8 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 8 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                default:
                                    break;
                            }
                        }
                        else
                        {
                            switch(rows[0][11])
                            {
                                case 'elektryczny':
                                    koszt = 24 + 7 * (hours - 3);
                                    break;
                                case 'szosowy':
                                    koszt = 13 + 5 * (hours - 3);
                                    break;
                                case 'miejski':
                                    koszt = 13 + 5 * (hours - 3);
                                    break;
                                case 'dziecięcy':
                                    koszt = 8 + 2 * (hours - 3);
                                    break;
                                default:
                                    break;
                            }
                            pool.getConnection()
                                .then((conn2) => {
                                    conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = ? WHERE id_wypozyczenia = ?',[koszt,id_wypozyczenia])
                                    .then((rows1) => {
                                        req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę "+koszt+" zł.";
                                        req.session.id_wypozyczenia = id_wypozyczenia;
                                        res.redirect('/admin_dash');
                                        conn2.end();
                                        conn.end();
                                    })
                                    .catch(err => { console.log(err); });
                                    conn2.end();
                                    conn.end();
                                })
                                .catch(err => { console.log(err); });
                        }
                    }
                    else if(rows[0][6] == 3)
                    {
                        if(przejechane_kilometry <= 5)
                        {
                            switch(rows[0][11])
                            {
                                case 'elektryczny':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 20 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 20 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'szosowy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 16 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 16 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'miejski':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 16 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 16 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'dziecięcy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 12 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 12 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                default:
                                    break;
                            }
                        }
                        else if(przejechane_kilometry > 5 && przejechane_kilometry <= 10)
                        {
                            switch(rows[0][11])
                            {
                                case 'elektryczny':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 30 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 30 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'szosowy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 20 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 20 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'miejski':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 20 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 20 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                case 'dziecięcy':
                                    pool.getConnection()
                                        .then((conn2) => {
                                            conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = 12 WHERE id_wypozyczenia = ?',id_wypozyczenia)
                                            .then((rows1) => {
                                                req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę 12 zł.";
                                                req.session.id_wypozyczenia = id_wypozyczenia;
                                                res.redirect('/admin_dash');
                                                conn2.end();
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); });
                                            conn2.end();
                                            conn.end();
                                        })
                                        .catch(err => { console.log(err); });
                                    break;
                                default:
                                    break;
                            }
                        }
                        else
                        {
                            przejechane_kilometry -= 10;
                            switch(rows[0][11])
                            {
                                case 'elektryczny':
                                    koszt = 30 + przejechane_kilometry;
                                    break;
                                case 'szosowy':
                                    koszt = 20 + przejechane_kilometry * 0.8;
                                    break;
                                case 'miejski':
                                    koszt = 20 + przejechane_kilometry * 0.8;
                                    break;
                                case 'dziecięcy':
                                    koszt = 12 + przejechane_kilometry * 0.4;
                                    break;
                                default:
                                    break;
                            }
                            pool.getConnection()
                                .then((conn2) => {
                                    conn2.query('UPDATE wypozyczenia SET data_zakonczenia = NOW(), koszt = ? WHERE id_wypozyczenia = ?',[koszt,id_wypozyczenia])
                                    .then((rows1) => {
                                        req.session.zakonczenie_wynajmu = "Wynajem nr "+id_wypozyczenia+" zakończony. Klient musi uiścić opłatę "+koszt+" zł.";
                                        req.session.id_wypozyczenia = id_wypozyczenia;
                                        res.redirect('/admin_dash');
                                        conn2.end();
                                        conn.end();
                                    })
                                    .catch(err => { console.log(err); });
                                    conn2.end();
                                    conn.end();
                                })
                                .catch(err => { console.log(err); });
                        }
                    }
                })
                .catch(err => { console.log(err); })
        })
        .catch(err => { console.log(err); })
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

