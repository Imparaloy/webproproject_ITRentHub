-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 12, 2025 at 02:39 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `test`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `User_ID` varchar(13) NOT NULL,
  `User_Name` varchar(20) NOT NULL,
  `Email` varchar(50) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Phone_Number` varchar(10) NOT NULL,
  `Roles` varchar(7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `facility`
--

CREATE TABLE `facility` (
  `Rental_ID` varchar(13) NOT NULL,
  `Air_Conditioner` tinyint(1) DEFAULT NULL,
  `Furnished` tinyint(1) DEFAULT NULL,
  `Water_Heater` tinyint(1) DEFAULT NULL,
  `Fan` tinyint(1) DEFAULT NULL,
  `Refrigerator` tinyint(1) DEFAULT NULL,
  `Parking` tinyint(1) DEFAULT NULL,
  `Bicycle_Parking` tinyint(1) DEFAULT NULL,
  `Lift` tinyint(1) DEFAULT NULL,
  `Pool` tinyint(1) DEFAULT NULL,
  `Fitness` tinyint(1) DEFAULT NULL,
  `Security_keycard` tinyint(1) DEFAULT NULL,
  `Security_finger_print` tinyint(1) DEFAULT NULL,
  `CCTV` tinyint(1) DEFAULT NULL,
  `Security` tinyint(1) DEFAULT NULL,
  `In_Room_WIFI` tinyint(1) DEFAULT NULL,
  `Pets` tinyint(1) DEFAULT NULL,
  `Smoking` tinyint(1) DEFAULT NULL,
  `Laundry` tinyint(1) DEFAULT NULL,
  `Kitchen_Stove` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rental_data`
--

CREATE TABLE `rental_data` (
  `Rental_ID` varchar(13) NOT NULL,
  `User_ID` varchar(13) NOT NULL,
  `Rental_Name` varchar(20) NOT NULL,
  `Type` varchar(10) NOT NULL,
  `Description` varchar(255) NOT NULL,
  `Phone_number` varchar(10) NOT NULL,
  `Line_ID` varchar(50) NOT NULL,
  `Location` varchar(255) NOT NULL,
  `Photo` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rental_price`
--

CREATE TABLE `rental_price` (
  `Rental_ID` varchar(13) NOT NULL,
  `rental_price` int(11) NOT NULL,
  `advance_payment` int(11) DEFAULT NULL,
  `electric_price` float DEFAULT NULL,
  `water_price` float DEFAULT NULL,
  `service_price` float DEFAULT NULL,
  `phone_price` float DEFAULT NULL,
  `internet_price` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

CREATE TABLE `review` (
  `Rental_ID` varchar(13) NOT NULL,
  `User_ID` varchar(13) NOT NULL,
  `Rating` float NOT NULL,
  `Comment` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_data`
--

CREATE TABLE `room_data` (
  `Rental_ID` varchar(13) NOT NULL,
  `Room_ID` varchar(13) NOT NULL,
  `Room_Name` varchar(13) NOT NULL,
  `Room_Type` varchar(10) NOT NULL,
  `Size` float NOT NULL,
  `Monthly_Rental` int(8) NOT NULL,
  `Room_Status` tinyint(1) NOT NULL,
  `Number_Available_Room` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`User_ID`);

--
-- Indexes for table `facility`
--
ALTER TABLE `facility`
  ADD PRIMARY KEY (`Rental_ID`);

--
-- Indexes for table `rental_data`
--
ALTER TABLE `rental_data`
  ADD PRIMARY KEY (`Rental_ID`);

--
-- Indexes for table `rental_price`
--
ALTER TABLE `rental_price`
  ADD PRIMARY KEY (`Rental_ID`);

--
-- Indexes for table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`Rental_ID`,`User_ID`);

--
-- Indexes for table `room_data`
--
ALTER TABLE `room_data`
  ADD PRIMARY KEY (`Room_ID`,`Rental_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
