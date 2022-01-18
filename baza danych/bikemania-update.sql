-- phpMyAdmin SQL Dump
-- version 3.5.5
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Czas wygenerowania: 18 Sty 2022, 11:12
-- Wersja serwera: 5.5.21-log
-- Wersja PHP: 5.3.20

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Baza danych: `bike`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `aktualnosci`
--

CREATE TABLE IF NOT EXISTS `aktualnosci` (
  `id_aktualnosci` int(10) unsigned NOT NULL,
  `tytul_aktualnosci` varchar(128) COLLATE utf8_polish_ci NOT NULL,
  `autor_aktualnosci` int(10) unsigned NOT NULL,
  `tresc_aktualnosci` mediumtext COLLATE utf8_polish_ci NOT NULL,
  `data_publikacji` datetime NOT NULL,
  PRIMARY KEY (`id_aktualnosci`),
  KEY `autor_aktualnosci` (`autor_aktualnosci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `promocje`
--

CREATE TABLE IF NOT EXISTS `promocje` (
  `id_promocji` int(10) unsigned NOT NULL,
  `rodzaj_promocji` varchar(25) COLLATE utf8_polish_ci NOT NULL,
  `cena_znizki` float unsigned NOT NULL,
  PRIMARY KEY (`id_promocji`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `rowery`
--

CREATE TABLE IF NOT EXISTS `rowery` (
  `id_roweru` int(10) unsigned NOT NULL,
  `model` varchar(25) COLLATE utf8_polish_ci NOT NULL,
  `typ_roweru` varchar(25) COLLATE utf8_polish_ci NOT NULL,
  PRIMARY KEY (`id_roweru`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `uzytkownicy`
--

CREATE TABLE IF NOT EXISTS `uzytkownicy` (
  `id_uzytkownika` int(10) unsigned NOT NULL,
  `imie` varchar(25) COLLATE utf8_polish_ci NOT NULL,
  `nazwisko` varchar(25) COLLATE utf8_polish_ci NOT NULL,
  `numer_telefonu` int(11) NOT NULL,
  `pesel` int(11) DEFAULT NULL,
  `numer_dowodu_osobistego` varchar(9) COLLATE utf8_polish_ci DEFAULT NULL,
  PRIMARY KEY (`id_uzytkownika`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `wypozyczenia`
--

CREATE TABLE IF NOT EXISTS `wypozyczenia` (
  `id_wypozyczenia` int(10) unsigned NOT NULL,
  `id_roweru` int(10) unsigned NOT NULL,
  `id_uzytkownika` int(10) unsigned NOT NULL,
  `data_rozpoczecia` datetime NOT NULL,
  `data_zakonczenia` datetime NOT NULL,
  `id_promocji` int(10) unsigned NOT NULL,
  `nr_cennika` int(11) unsigned NOT NULL,
  `przejechane_km` float DEFAULT NULL,
  `cena_ostateczna` float unsigned NOT NULL,
  PRIMARY KEY (`id_wypozyczenia`),
  KEY `id_roweru` (`id_roweru`),
  KEY `id_uzytkownika` (`id_uzytkownika`),
  KEY `id_promocji` (`id_promocji`),
  KEY `przejechane_km` (`przejechane_km`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci;

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `aktualnosci`
--
ALTER TABLE `aktualnosci`
  ADD CONSTRAINT `aktualnosci_ibfk_1` FOREIGN KEY (`autor_aktualnosci`) REFERENCES `uzytkownicy` (`id_uzytkownika`);

--
-- Ograniczenia dla tabeli `wypozyczenia`
--
ALTER TABLE `wypozyczenia`
  ADD CONSTRAINT `wypozyczenia_ibfk_1` FOREIGN KEY (`id_roweru`) REFERENCES `rowery` (`id_roweru`),
  ADD CONSTRAINT `wypozyczenia_ibfk_2` FOREIGN KEY (`id_uzytkownika`) REFERENCES `uzytkownicy` (`id_uzytkownika`),
  ADD CONSTRAINT `wypozyczenia_ibfk_3` FOREIGN KEY (`id_promocji`) REFERENCES `promocje` (`id_promocji`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
