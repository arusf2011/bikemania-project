# Dokumentacja Bikemania
## Wymagania
- MySQL Server (lub inny, który działa z MySQL np. MariaDB)
- Node.js w wersji 14 lub wyższej
## Jak skonfigurować skrypt do działania?
Aby skrypt mógł zostać uruchomiony należy postępować zgodnie z poniższymi krokami

1. Zainstalować MySQL Server (lub inny) na urządzeniu, na którym będziemy chcieli trzymać bazę danych.
2. Zainstalować Node.js (rekomendawana jest wersja 14) oraz npm.
3. Pobrać niniejsze repozytorium, a następnie:
- zaimportować bazę danych
```sql
mysql -u nazwa_uzytkownika -p nazwa_bazy_danych < lokalizacja_do_pliku_sql
```
- zainstalować pakiety wymagane do działania skryptu
```bash
npm install
```
- skonfigurować zmienne
> Linia 26
```javascript
const pool = mariadb.createPool({
    host: 'xxxxx', // nazwa hosta lub adres IP
    user: 'xxxxx', // nazwa użytkownika
    password: 'xxxxx', // hasło użytkownika
    database: 'xxxxx', // nazwa bazy danych
    port: 0, // port (domyślnie 3306)
    rowsAsArray: true // bez zmian
});
```
> Linia 288
```javascript
check('nazwa_uzytkownika')
        .equals("admin") // ustawić nazwę użytkownika dla administratora
        .withMessage('Nieprawidłowa nazwa użytkownika'),
check('haslo')
    .equals('xxxxxx') // ustawić hasło
    .withMessage('Nieprawidłowe hasło')
```
4. Włączyć skrypt
```
npm start
```