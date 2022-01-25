-- MySQL dump 10.13  Distrib 8.0.25, for Win64 (x86_64)
--
-- Host: localhost    Database: bikemania
-- ------------------------------------------------------
-- Server version	8.0.25

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `aktualnosci`
--

DROP TABLE IF EXISTS `aktualnosci`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aktualnosci` (
  `id_aktualnosci` int unsigned NOT NULL AUTO_INCREMENT,
  `tytul_aktualnosci` varchar(128) CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  `autor_aktualnosci` varchar(20) CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  `tresc_aktualnosci` mediumtext CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  `data_publikacji` datetime NOT NULL,
  PRIMARY KEY (`id_aktualnosci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8_polish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aktualnosci`
--

LOCK TABLES `aktualnosci` WRITE;
/*!40000 ALTER TABLE `aktualnosci` DISABLE KEYS */;
/*!40000 ALTER TABLE `aktualnosci` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `magazyny`
--

DROP TABLE IF EXISTS `magazyny`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazyny` (
  `id_magazynu` int unsigned NOT NULL AUTO_INCREMENT,
  `nazwa_magazynu` varchar(25) COLLATE utf8_polish_ci NOT NULL,
  `rozmiar_magazynu` int unsigned NOT NULL,
  `stan_magazynu` enum('empty','full','medium') CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  PRIMARY KEY (`id_magazynu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8_polish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `magazyny`
--

LOCK TABLES `magazyny` WRITE;
/*!40000 ALTER TABLE `magazyny` DISABLE KEYS */;
/*!40000 ALTER TABLE `magazyny` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promocje`
--

DROP TABLE IF EXISTS `promocje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promocje` (
  `id_promocji` int unsigned NOT NULL AUTO_INCREMENT,
  `rodzaj_promocji` varchar(25) CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  `cena_znizki` float unsigned NOT NULL,
  `id_aktualnosci` int unsigned NOT NULL,
  PRIMARY KEY (`id_promocji`),
  KEY `id_aktualnosci` (`id_aktualnosci`),
  CONSTRAINT `promocje_ibfk_1` FOREIGN KEY (`id_aktualnosci`) REFERENCES `aktualnosci` (`id_aktualnosci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8_polish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promocje`
--

LOCK TABLES `promocje` WRITE;
/*!40000 ALTER TABLE `promocje` DISABLE KEYS */;
/*!40000 ALTER TABLE `promocje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rowery`
--

DROP TABLE IF EXISTS `rowery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rowery` (
  `id_roweru` int unsigned NOT NULL AUTO_INCREMENT,
  `model` varchar(25) CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  `typ_roweru` varchar(25) CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  `id_magazynu` int unsigned NOT NULL,
  PRIMARY KEY (`id_roweru`),
  KEY `id_magazynu` (`id_magazynu`),
  CONSTRAINT `rowery_ibfk_1` FOREIGN KEY (`id_magazynu`) REFERENCES `magazyny` (`id_magazynu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8_polish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rowery`
--

LOCK TABLES `rowery` WRITE;
/*!40000 ALTER TABLE `rowery` DISABLE KEYS */;
/*!40000 ALTER TABLE `rowery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uzytkownicy`
--

DROP TABLE IF EXISTS `uzytkownicy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uzytkownicy` (
  `id_uzytkownika` int unsigned NOT NULL AUTO_INCREMENT,
  `imie` varchar(25) CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  `nazwisko` varchar(25) CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL,
  `numer_telefonu` int NOT NULL,
  `pesel` int DEFAULT NULL,
  `numer_dowodu_osobistego` varchar(9) CHARACTER SET utf8 COLLATE utf8_polish_ci DEFAULT NULL,
  PRIMARY KEY (`id_uzytkownika`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8_polish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uzytkownicy`
--

LOCK TABLES `uzytkownicy` WRITE;
/*!40000 ALTER TABLE `uzytkownicy` DISABLE KEYS */;
/*!40000 ALTER TABLE `uzytkownicy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wypozyczenia`
--

DROP TABLE IF EXISTS `wypozyczenia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wypozyczenia` (
  `id_wypozyczenia` int unsigned NOT NULL AUTO_INCREMENT,
  `id_roweru` int unsigned NOT NULL,
  `id_uzytkownika` int unsigned NOT NULL,
  `data_rozpoczecia` datetime NOT NULL,
  `data_zakonczenia` datetime NOT NULL,
  `id_promocji` int unsigned NOT NULL,
  `nr_cennika` int unsigned NOT NULL,
  `przejechane_km` float DEFAULT NULL,
  `cena_ostateczna` float unsigned NOT NULL,
  `czy_oplacone` varchar(10) CHARACTER SET utf8 COLLATE utf8_polish_ci DEFAULT NULL,
  PRIMARY KEY (`id_wypozyczenia`),
  KEY `id_roweru` (`id_roweru`),
  KEY `id_uzytkownika` (`id_uzytkownika`),
  KEY `id_promocji` (`id_promocji`),
  KEY `przejechane_km` (`przejechane_km`),
  CONSTRAINT `wypozyczenia_ibfk_1` FOREIGN KEY (`id_roweru`) REFERENCES `rowery` (`id_roweru`),
  CONSTRAINT `wypozyczenia_ibfk_2` FOREIGN KEY (`id_uzytkownika`) REFERENCES `uzytkownicy` (`id_uzytkownika`),
  CONSTRAINT `wypozyczenia_ibfk_3` FOREIGN KEY (`id_promocji`) REFERENCES `promocje` (`id_promocji`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8_polish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wypozyczenia`
--

LOCK TABLES `wypozyczenia` WRITE;
/*!40000 ALTER TABLE `wypozyczenia` DISABLE KEYS */;
/*!40000 ALTER TABLE `wypozyczenia` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-01-25 13:27:27
