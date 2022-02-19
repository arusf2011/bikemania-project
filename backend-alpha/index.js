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
const { connect } = require('http2');
const { emitWarning } = require('process');
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
    host: 'xxxxx', // nazwa hosta lub adres IP
    user: 'xxxxx', // nazwa użytkownika
    password: 'xxxxx', // hasło użytkownika
    database: 'xxxxx', // nazwa bazy danych
    port: 0, // port (domyślnie 3306)
    rowsAsArray: true // bez zmian
});
// Po inicjacji przechodzę do generowania widoków stron
app.get('/', (req,res) => {
    res.render('pages/index');
    console.log('Strona index została wyświetlona');
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
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT id_magazynu, nazwa_magazynu FROM magazyny')
                    .then((rows) => {
                        res.render('pages/nowa_rezerwacja',{
                            magazyny: rows
                        });
                        conn.end();
                    })
                    .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/rezerwacje');
    }
});
app.post('/api_rowery',(req,res) => {
    start_data = req.body.start_data;
    end_data = req.body.end_data;
    magazine = req.body.magazine;
    pool.getConnection()
        .then((conn) => {
            conn.query('SELECT DISTINCT rowery.id_roweru as id_roweru, model, typ_roweru FROM rowery LEFT JOIN wypozyczenia ON rowery.id_roweru = wypozyczenia.id_roweru WHERE id_magazynu = ? AND (((wypozyczenia.data_zakonczenia < ? OR wypozyczenia.data_rozpoczecia > ?) AND (wypozyczenia.data_zakonczenia < ? OR wypozyczenia.data_rozpoczecia > ?)) OR wypozyczenia.id_roweru IS null)',[magazine,start_data,start_data,end_data,end_data])
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
                conn.query('INSERT INTO wypozyczenia VALUES(null,?,?,?,?,1,?,null,1,null)',[rower,id_uzytkownika,data_start,data_koniec,cennik])
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
    pool.getConnection()
        .then((conn) => {
            conn.query('SELECT * FROM aktualnosci')
                .then((rows) => {
                    res.render('pages/aktualnosci',{
                        aktual: rows
                    });
                    console.log('Strona aktualnosci została wyświetlona');
                })
                .catch(err => { console.log(err); })
        })
        .catch(err => { console.log(err); })
});
app.get('/serwis', (req,res) => {
    res.render('pages/serwis');
    console.log('Strona serwis została wyświetlona');
});
// Podsumowanie rezerwacji
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
// Panel administracyjny
/// Logowanie
app.get('/admin_login',(req,res) => {
    if(req.session.errors != null)
    {
        errors_arr = req.session.errors;
        req.session.errors = null;
        res.render('pages/admin_login',{
            errors: errors_arr
        });

    }
    else
    {
        res.render('pages/admin_login',{
            errors: ''
        })
    }
});
/// Autentykacja
app.post('/auth_admin',[
    check('nazwa_uzytkownika')
        .equals("admin") // ustawić nazwę użytkownika dla administratora
        .withMessage('Nieprawidłowa nazwa użytkownika'),
    check('haslo')
        .equals('xxxxxx') // ustawić hasło
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
/// Wylogowywanie
app.get('/admin_logout',(req,res) => {
    req.session.adminLoggedIn = false;
    res.redirect('/');
});
/// Panel administracyjny
app.get('/admin_dash',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT id_wypozyczenia, imie, nazwisko, wypozyczenia.id_roweru, model, typ_roweru, data_rozpoczecia, data_zakonczenia, czy_oplacone FROM wypozyczenia JOIN rowery ON wypozyczenia.id_roweru = rowery.id_roweru JOIN uzytkownicy ON wypozyczenia.id_uzytkownika = uzytkownicy.id_uzytkownika')
                    .then((rows) => {
                        wypozyczenia_arr = rows;
                        conn.query('SELECT * FROM aktualnosci')
                            .then((rows) => {
                                aktualnosci_arr = rows;
                                conn.query('SELECT * FROM magazyny')
                                    .then((rows) => {
                                        magazyny_arr = rows;
                                        conn.query('SELECT * FROM rowery')
                                            .then((rows) => {
                                                error_msg = req.session.error;
                                                req.session.error = null;
                                                res.render('pages/admin_dash',{
                                                    wypozyczenia: wypozyczenia_arr,
                                                    magazyny: magazyny_arr,
                                                    aktualnosci: aktualnosci_arr,
                                                    rowery: rows,
                                                    error: error_msg
                                                });
                                                conn.end();
                                            })
                                            .catch(err => { console.log(err); conn.end(); });
                                    })
                                    .catch(err => { console.log(err); conn.end(); });
                            })
                            .catch(err => { console.log(err); conn.end(); });
                    })
                    .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_login');
    }
});
app.get('/raport',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT id_wypozyczenia, imie, nazwisko, wypozyczenia.id_roweru, model, typ_roweru, data_rozpoczecia, data_zakonczenia, czy_oplacone, nr_cennika, przejechane_km FROM wypozyczenia JOIN rowery ON wypozyczenia.id_roweru = rowery.id_roweru JOIN uzytkownicy ON wypozyczenia.id_uzytkownika = uzytkownicy.id_uzytkownika')
                    .then((rows) => {
                        res.render('pages/raport',{
                            wypozyczenia: rows
                        });
                    })
                    .catch(err => {console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); })

    }
    else
    {
        res.redirect('/admin_login')
    }
})
// Zarządzanie rezerwacjami
/// Anulowanie rezerwacji
app.get('/anuluj_rezerwacje/:id',(req,res) => {
    id_wypozyczenia = req.params.id;
    pool.getConnection()
        .then((conn) => {
            conn.query('DELETE FROM wypozyczenia WHERE id_wypozyczenia = ?',id_wypozyczenia)
                .then((rows) => {
                    res.redirect('/admin_dash');
                    conn.end();
                })
                .catch(err => { console.log(err); });
                conn.end();
        })
        .catch(err => { console.log(err); })
});
/// Opłacenie wynajmu
//// Generowanie formularza do opłacenia wynajmu
app.get('/oplac_wynajem/:id',(req,res) => {
    id_wypozyczenia = req.params.id;
    pool.getConnection()
        .then((conn) => {
            conn.query('SELECT nr_cennika, data_rozpoczecia, data_zakonczenia, id_wypozyczenia FROM wypozyczenia WHERE id_wypozyczenia = ?',id_wypozyczenia)
                .then((rows) => {
                    res.render('pages/oplac_wynajem',{
                        wynajem: rows[0]
                    });
                    conn.end();
                })
                .catch(err => { console.log(err); });
                conn.end();
        })
        .catch(err => { console.log(err); });

});
//// Opłacenie wynajmu w bazie danych
app.post('/oplac_wynajem',(req,res) => {
    pool.getConnection()
        .then((conn) => {
            conn.query('UPDATE wypozyczenia SET przejechane_km = ?, cena_ostateczna = ?, czy_oplacone = ? WHERE id_wypozyczenia = ?',[
                req.body.przejechane_km,
                req.body.cena_ostateczna,
                req.body.czy_oplacone,
                req.body.id_wypozyczenia
            ])
            .then((rows) => {
                res.redirect('/admin_dash');
            })
            .catch(err => { console.log(err); conn.end(); });
        })
        .catch(err => { console.log(err); });
});
// Zarządzenia aktualnościami
/// Dodawanie aktualności
//// Generowanie formularza do dodawania aktualności
app.get('/dodaj_aktualnosc',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        res.render('pages/dodaj_aktualnosc');
    }
    else
    {
        res.redirect('/admin_login');
    }
});
//// Dodawanie aktualności do bazy danych
app.post('/opublikowanie_aktualnosci',(req,res) => {
    if(req.session.adminLoggedIn)
    {
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
    }
    else
    {
        res.redirect('/admin_login');
    }
});
/// Edycja aktualności
//// Pobieranie danych do formularza
app.get('/edytuj_aktualnosc/:id',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT * FROM aktualnosci WHERE id_aktualnosci = ?',req.params.id)
                    .then((rows) => {
                        res.render('pages/edytuj_aktualnosc',{
                           aktualnosc: rows[0]
                        });
                        conn.end();
                    })
                    .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err);});
    }
    else
    {
        res.redirect('/admin_login');
    }
});
//// Edycja danych w bazie danych
app.post('/edytuj_aktualnosc',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('UPDATE aktualnosci SET tytul_aktualnosci = ?, autor_aktualnosci = ?, tresc_aktualnosci = ? WHERE id_aktualnosci = ?',[
                    req.body.tytul_aktualnosci,
                    req.body.autor_aktualnosci,
                    req.body.tresc_aktualnosci,
                    req.body.id_aktualnosci
                ])
                .then((rows) => {
                    res.redirect('/admin_dash');
                })
                .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_login');
    }
})
/// Usuwanie aktualności
app.get('/usun_aktualnosc/:id',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('DELETE FROM aktualnosci WHERE id_aktualnosci = ?',req.params.id)
                    .then((rows) => {
                        res.redirect('/admin_dash');
                    })
                    .catch(err => {
                        console.log(err);
                        conn.end();
                    })
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_login');
    }
});
// Zarządzanie magazynami
/// Dodawanie magazynu
//// Generowanie formularza do dodawania magazynu
app.get('/dodaj_magazyn',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        res.render('pages/dodaj_magazyn');
    }
    else
    {
        res.redirect('/admin_dash');
    }

});
//// Dodawanie magazynu do bazy danych
app.post('/dodaj_magazyn',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('INSERT INTO magazyny VALUES(NULL,?,?,?)',[
                    req.body.nazwa_magazynu,
                    req.body.rozmiar_magazynu,
                    req.body.stan_magazynu
                ])
                .then((rows) => {
                    res.redirect('/admin_dash');
                })
                .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_dash');
    }
    
});
/// Edycja magazynu
//// Generowanie formularza do edycji magazynu
app.get('/edytuj_magazyn/:id',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT * FROM magazyny WHERE id_magazynu = ?',req.params.id)
                    .then((rows) => {
                        res.render('pages/edytuj_magazyn',{
                           magazyn: rows[0]
                        });
                        conn.end();
                    })
                    .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err);});
    }
    else
    {
        res.redirect('/admin_dash');
    }
    
});
//// Edycja magazynu w bazie danych
app.post('/edytuj_magazyn',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('UPDATE magazyny SET nazwa_magazynu = ?, rozmiar_magazynu = ?, stan_magazynu = ? WHERE id_magazynu = ?',[
                    req.body.nazwa_magazynu,
                    req.body.rozmiar_magazynu,
                    req.body.stan_magazynu,
                    req.params.id
                ])
                .then((rows) => {
                    res.redirect('/admin_dash');
                })
                .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_dash');
    }
    
});
/// Usuwanie magazynu
app.get('/usun_magazyn/:id',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('DELETE FROM magazyny WHERE id_magazynu = ?',req.params.id)
                    .then((rows) => {
                        res.redirect('/admin_dash');
                    })
                    .catch(err => {
                        if(err.sqlState == 23000)
                        {
                            req.session.error = 'Istnieją powiązane rowery z magazynem numer '+req.params.id+'! Przenieś je do innego magazynu!';
                            res.redirect('/admin_dash');
                        }
                        else
                        {
                            console.log(err);
                            conn.end();
                        }
                    })
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_dash');
    }
});
// Zarządzanie rowerami
/// Dodawanie roweru
//// Generowanie formularza do dodawania roweru
app.get('/dodaj_rower',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT * FROM magazyny')
                    .then((rows) => {
                        res.render('pages/dodaj_rower',{
                            magazyny: rows
                        });
                    })
                    .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_dash');
    }

});
//// Dodawanie roweru do bazy danych
app.post('/dodaj_rower',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('INSERT INTO rowery VALUES(NULL,?,?,?)',[
                    req.body.model,
                    req.body.typ_roweru,
                    req.body.id_magazynu
                ])
                .then((rows) => {
                    res.redirect('/admin_dash');
                })
                .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_dash');
    }
    
});
/// Edycja roweru
//// Generowanie formularza do edycji roweru
app.get('/edytuj_rower/:id',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('SELECT * FROM rowery WHERE id_roweru = ?',req.params.id)
                    .then((rows) => {
                        rower_arr = rows[0];
                        conn.query('SELECT * FROM magazyny')
                            .then((rows) => {
                                res.render('pages/edytuj_rower',{
                                   rower: rower_arr,
                                   magazyny: rows
                                });
                                conn.end();
                            })
                            .catch(err => { console.log(err); conn.end(); })
                    })
                    .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err);});
    }
    else
    {
        res.redirect('/admin_dash');
    }
    
});
//// Edycja roweru w bazie danych
app.post('/edytuj_rower',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('UPDATE rowery SET model = ?, typ_roweru = ?, id_magazynu = ? WHERE id_roweru = ?',[
                    req.body.model,
                    req.body.typ_roweru,
                    req.body.id_magazynu,
                    req.params.id
                ])
                .then((rows) => {
                    res.redirect('/admin_dash');
                })
                .catch(err => { console.log(err); conn.end(); });
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_dash');
    }
    
});
/// Usuwanie roweru
app.get('/usun_rower/:id',(req,res) => {
    if(req.session.adminLoggedIn)
    {
        pool.getConnection()
            .then((conn) => {
                conn.query('DELETE FROM rowery WHERE id_roweru = ?',req.params.id)
                    .then((rows) => {
                        res.redirect('/admin_dash');
                    })
                    .catch(err => {
                        if(err.sqlState == 23000)
                        {
                            req.session.error = 'Istnieją powiązane wypożyczenia z rowerem numer '+req.params.id+'!';
                            res.redirect('/admin_dash');
                        }
                        else
                        {
                            console.log(err);
                            conn.end();
                        }
                    })
            })
            .catch(err => { console.log(err); });
    }
    else
    {
        res.redirect('/admin_dash');
    }
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

