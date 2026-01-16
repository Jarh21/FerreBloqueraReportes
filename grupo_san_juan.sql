/*
SQLyog Ultimate v13.1.1 (64 bit)
MySQL - 8.0.30 : Database - grupo_san_juan
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*Table structure for table `coloreal` */

DROP TABLE IF EXISTS `coloreal`;

CREATE TABLE `coloreal` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `codprod` int DEFAULT NULL,
  `nombre` varchar(250) DEFAULT NULL,
  `medida` float DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `coloreal` */

insert  into `coloreal`(`id`,`codprod`,`nombre`,`medida`) values 
(2,786,'COLOREAL AZUL PACIFICO GALON ECON.',1),
(3,800,'COLOREAL GRIS HUMO GALON ECON.',1),
(4,801,'COLOREAL ROSA VIEJA GALON ECON.',1),
(5,802,'COLOREAL MELON 4GAL. ECON.',4),
(6,810,'COLOREAL VERDE MANZANA GALON ECON.',1),
(7,811,'COLOREAL OSTRA 4GAL ECON.',4),
(8,814,'COLOREAL BLANCO GALON ECON.',1),
(9,815,'COLOREAL BLANCO 4GAL ECON.',4),
(10,817,'COLOREAL RUBOR GALON ECON.',1),
(11,818,'COLOREAL RUBOR 4GAL ECON.',4),
(12,820,'COLOREAL MARFIL GALON ECON.',1),
(13,822,'COLOREAL MARFIL 4GAL ECON.',4),
(14,827,'COLOREAL AMARILLO CREMA GALON ECON.',1),
(15,828,'COLOREAL ROJO CORAL GALON ECON.',1),
(16,830,'COLOREAL ROSA VIEJA 4GAL. ECON.',4),
(17,833,'COLOREAL GRIS HUMO 4GAL. ECON.',4),
(18,895,'COLOREAL VERDE MANZANA 4GAL ECON.',4),
(19,907,'COLOREAL AMARILLO CREMA 4GAL ECON.',4),
(20,911,'COLOREAL VERDE PASION 4GAL ECON.',4),
(21,2498,'COLOREAL GREIGE 4GAL. ECON.',4),
(22,2509,'COLOREAL OLIVO SERENO 4GAL. ECON.',4),
(23,4147,'COLOREAL NARANJA ALEGRIA  GALON ECON.',1),
(24,4166,'COLOREAL CHOCOLATE GALON ECON.',1),
(25,4176,'COLOREAL MOSTAZA GALON ECON.',1),
(26,4177,'COLOREAL AZUL IMPERIAL GALON ECON.',1),
(27,4178,'COLOREAL DECO CORAL GALON ECON.',1),
(28,4181,'COLOREAL VERDE PASION GALON ECON.',1),
(29,4198,'COLOREAL GREIGE GALON ECON.',1),
(30,4305,'COLOREAL AZUL CAMPESINO GALON ECON.',1),
(31,4496,'COLOREAL AZUL CAMPESINO 4GAL. ECON.',4),
(32,4594,'COLOREAL NARANJA ALEGRIA 4GAL. ECON.',4),
(33,4595,'COLOREAL OLIVO SERENO GALON ECON.',1),
(34,4596,'COLOREAL LADRILLO 4GAL. ECON.',4),
(35,4598,'COLOREAL LADRILLO GALON ECON.',1),
(36,5002,'COLOREAL AZUL PACIFICO 4GAL ECON.',4),
(37,5050,'COLOREAL ROJO CORAL 4GAL ECON.',4),
(38,5051,'COLOREAL TURQUESA CARIBE GALON ECON.',1),
(39,5052,'COLOREAL TURQUESA CARIBE 4GAL ECON.',4),
(40,5070,'COLOREAL OSTRA GALON ECON.',1),
(41,5078,'COLOREAL VIOLETA CLASICO 4GAL ECON.',4),
(42,5342,'COLOREAL MELON  GALON ECON.',1),
(43,5732,'COLOREAL VIOLETA CLASICO GALON ECON.',1),
(44,5822,'COLOREAL AZUL IMPERIAL 4GAL. ECON.',4),
(45,5823,'COLOREAL MOSTAZA 4GAL. ECON.',4),
(46,6177,'COLOREAL DECO CORAL 4GAL ECON.',4),
(47,7400,'COLOREAL CHOCOLATE  4GAL ECON.',4),
(48,7401,'COLOREAL GRIS PERLA GALON ECON.',1),
(49,7402,'COLOREAL GRIS PERLA 4GAL ECON.',4),
(50,569,'COLOREAL MARFIL AHORRO CUÑETE',4),
(51,572,'COLOREAL AZUL PACIFICO AHORRO CUÑETE',4),
(52,573,'COLOREAL SALMON AHORRO CUÑETE',4),
(53,584,'COLOREAL FUCSIA AHORRO CUÑETE',4),
(54,589,'COLOREAL ROJO CORAL AHORRO CUÑETE',4),
(55,595,'COLOREAL AMARILLO CREMA AHORRO CUÑETE',4),
(56,597,'COLOREAL VIOLETA CLASICO AHORRO CUÑETE',4),
(57,824,'COLOREAL NARANJA ACTIVA AHORRO CUÑETE',4),
(58,920,'COLOREAL ARENA AHORRO GALON',1),
(59,1757,'COLOREAL CREMA PERLADO AHORRO GALON',1),
(60,1760,'COLOREAL ROJO CORAL AHORRO GALON',1),
(61,1778,'COLOREAL AZUL PACIFICO AHORRO GALON',1),
(62,1791,'COLOREAL NARANJA ACTIVA AHORRO GALON',1),
(63,1801,'COLOREAL BLANCO AHORRO GALON',1),
(64,1805,'COLOREAL VERDE ESMERALDA AHORRO CUÑETE',4),
(65,1807,'COLOREAL VERDE ESMERALDA AHORRO GALON',1),
(66,1817,'COLOREAL AZUL SERENO AHORRO GALON',1),
(67,1989,'COLOREAL AMARILLO CREMA AHORRO GALON',1),
(68,3207,'COLOREAL OSTRA AHORRO CUÑETE',4),
(69,3694,'COLOREAL NEBLINA AHORRO GALON',1),
(70,3696,'COLOREAL MARFIL AHORRO GALON',1),
(71,3700,'COLOREAL BLANCO AHORRO CUÑETE',4),
(72,4485,'COLOREAL AMARILLO PRIMAVERA AHORRO CUÑETE',4),
(73,4514,'COLOREAL AMARILLO PRIMAVERA AHORRO GALON',1),
(74,4834,'COLOREAL VERDE MANZANA AHORRO CUÑETE',4),
(75,4893,'COLOREAL CREMA PERLADO AHORRO CUÑETE',4),
(76,4896,'COLOREAL TURQUESA CARIBE AHORRO CUÑETE',4),
(77,7404,'COLOREAL NEBLINA AHORRO CUÑETE',4),
(78,690,'COLOREAL SATINADO BLANCO 3LTS',1),
(79,917,'COLOREAL SATINADO GRIS CALIDO 17217',1),
(80,2398,'COLOREAL SATINADO SENSACION 17220',1),
(81,3108,'COLOREAL SATINADO VERDE ADONIS 17219',1),
(82,4292,'COLOREAL SATINADO AZUL MANANTIAL.',1),
(83,4880,'COLOREAL SATINADO MIMBRE 17218',1),
(84,4881,'COLOREAL SATINADO AMARILLO TROPICAL 17221',1),
(85,4882,'COLOREAL SATINADO NEGRO 17222',1),
(86,5063,'COLOREAL SATINADO BLANCO 17201',1),
(87,5064,'COLOREAL SATINADO MARFIL 17211',1),
(88,5065,'COLOREAL SATINADO SALMON 17212',1),
(89,5066,'COLOREAL SATINADO GUAYABA 17213',1),
(90,5067,'COLOREAL SATINADO TURQUESA17214',1),
(91,5068,'COLOREAL SATINADO VERDE CARIBE 17215',1),
(92,5069,'COLOREAL SATINADO AZUL CIELO 17216',1),
(93,6535,'COLOREAL SATINADO PISTACHO',1),
(94,6536,'COLOREAL SATINADO LILA BOREAL',1),
(95,6537,'COLOREAL SATINADO GRIS CLARO',1),
(96,6538,'COLOREAL SATINADO ROSA PERLA',1),
(97,647,'ESMALTE COLOREAL VERDE MEDIO PREMIUN GALON',1),
(98,650,'ESMALTE COLOREAL VERDE BOSQUE PREMIUN 1/4G',0.25),
(99,788,'ESMALTE NEGRO COLOREAL 1/4G',0.25),
(100,805,'ESMALTE NEGRO COLOREAL GALON',1),
(101,806,'ESMALTE NEGRO MATE COLOREAL GALON',1),
(102,834,'ESMALTE NEGRO MATE COLOREAL 1/4G',0.25),
(103,1766,'ESMALTE COLOREAL MARFIL CLASICO PREMIUN GALON',1),
(104,2268,'ESMALTE COLOREAL AMARILLO CATERPILLAR GALON',1),
(105,3040,'ESMALTE BLANCO MATE COLOREAL 1/4',0.25),
(106,3048,'ESMALTE BLANCO MATE COLOREAL GALON',1),
(107,3055,'ESMALTE BLANCO COLOREAL 1/4',0.25),
(108,4025,'ESMALTE AZUL SUAVE COLOREAL GALON',1),
(109,4291,'ESMALTE AMARILLO COLOREAL 1/4',0.25),
(110,4433,'ESMALTE AZUL SUAVE COLOREAL 1/4',0.25),
(111,4809,'ESMALTE VERDE MANZANA COLOREAL 1/4',0.25),
(112,4813,'ESMALTE MARFIL SUAVE COLOREAL 1/4',0.25),
(113,5275,'ESMALTE BLANCO COLOREAL GALON',1),
(114,5408,'ESMALTE BLANCO OSTRA COLOREAL GALON',1),
(115,5409,'ESMALTE MARFIL SUAVE COLOREAL GALON',1),
(116,5410,'ESMALTE AMARILLO ARAGUANEY COLOREAL GALON',1),
(117,5411,'ESMALTE CAOBA COLOREAL GALON',1),
(118,5412,'ESMALTE VERDE MANZANA COLOREAL GALON',1),
(119,5413,'ESMALTE GRIS MEDIO COLOREAL GALON',1),
(120,5414,'ESMALTE ROJO INTENSO COLOREAL GALON',1),
(121,5415,'ESMALTE AZUL COLONIAL COLOREAL GALON',1),
(122,5416,'ESMALTE BLANCO OSTRA COLOREAL 1/4',0.25),
(123,5417,'ESMALTE CAOBA COLOREAL 1/4',0.25),
(124,5418,'ESMALTE AMARILLO ARAGUANEY COLOREAL 1/4',0.25),
(125,5419,'ESMALTE NARANJA COLOREAL GALON',1),
(126,5420,'ESMALTE NARANJA COLOREAL 1/4',0.25),
(127,5421,'ESMALTE COLOREAL AMARILLO CATERP. 1/4',0.25),
(128,5422,'ESMALTE VERDE COLOREAL GALON',1),
(129,5423,'ESMALTE VERDE COLOREAL 1/4',0.25),
(130,5424,'ESMALTE GRIS MEDIO COLOREAL 1/4',0.25),
(131,5425,'ESMALTE ROJO INTENSO COLOREAL 1/4',0.25),
(132,5433,'ESMALTE AZUL COLONIAL COLOREAL 1/4',0.25),
(133,7373,'ESMALTE 2 EN 1  COLOREAL BLANCO GALON',1),
(134,7374,'ESMALTE 2 EN 1 COLOREAL NEGRO GALON',1),
(135,7375,'ESMALTE 2 EN 1 COLOREAL GRIS ACERO GALON',1),
(136,7376,'ESMALTE 2 EN 1 COLOREAL AZUL MAR GALON',1),
(137,7377,'ESMALTE ALUMINIO COLOREAL GALON',1),
(138,7378,'ESMALTE ALUMINIO COLOREAL 1/4 GAL.',0.25);

/*Table structure for table `cuadre_arqueo_cerrado` */

DROP TABLE IF EXISTS `cuadre_arqueo_cerrado`;

CREATE TABLE `cuadre_arqueo_cerrado` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint DEFAULT NULL,
  `codusua` bigint DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `total_efectivo_cuadre` decimal(18,2) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

/*Data for the table `cuadre_arqueo_cerrado` */

insert  into `cuadre_arqueo_cerrado`(`id`,`empresa_id`,`codusua`,`fecha`,`total_efectivo_cuadre`,`created_by`,`created_at`) values 
(1,3,29,'2025-12-11',2482.76,3,'2025-12-16 11:20:36'),
(2,3,17,'2025-12-17',1702.57,3,'2025-12-18 08:47:53'),
(3,3,14,'2025-12-19',10.83,6,'2025-12-20 15:55:58'),
(4,3,17,'2025-12-19',68.28,6,'2025-12-20 16:00:37'),
(5,3,29,'2025-12-19',164.30,6,'2025-12-20 16:01:56'),
(6,3,50,'2025-12-19',175.53,3,'2025-12-20 16:51:55'),
(7,3,46,'2025-12-19',414.14,3,'2025-12-20 16:54:36'),
(8,3,60,'2025-12-19',128.42,3,'2025-12-20 16:58:30'),
(9,3,62,'2025-12-19',181.19,3,'2025-12-20 16:59:15'),
(10,3,14,'2025-12-20',101.41,5,'2025-12-20 17:45:58'),
(11,3,17,'2025-12-20',121.81,5,'2025-12-20 17:52:15'),
(12,3,46,'2025-12-20',553.78,5,'2025-12-20 17:56:30'),
(13,3,62,'2025-12-20',42.98,5,'2025-12-20 18:08:40'),
(14,3,29,'2025-12-20',131.62,5,'2025-12-20 18:16:56'),
(15,3,50,'2025-12-20',31.06,5,'2025-12-20 19:04:47'),
(16,3,60,'2025-12-20',127.02,5,'2025-12-20 19:15:08');

/*Table structure for table `cuadre_arqueo_egresos` */

DROP TABLE IF EXISTS `cuadre_arqueo_egresos`;

CREATE TABLE `cuadre_arqueo_egresos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `codusua` int DEFAULT NULL,
  `cont_concepto_id` bigint DEFAULT NULL,
  `concepto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `tipo_pago_id` bigint DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `monto` decimal(18,2) DEFAULT NULL,
  `valor_tasa` float DEFAULT NULL,
  `debito_calculado` decimal(18,2) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

/*Data for the table `cuadre_arqueo_egresos` */

insert  into `cuadre_arqueo_egresos`(`id`,`empresa_id`,`fecha`,`codusua`,`cont_concepto_id`,`concepto`,`tipo_pago_id`,`descripcion`,`monto`,`valor_tasa`,`debito_calculado`,`created_by`,`created_at`) values 
(12,4,'2025-12-11',31,33,'Papeleria',1,'compra de lapices',30000.00,273.59,109.65,3,'2025-12-16 08:23:50'),
(13,3,'2025-12-11',29,9,'Mantenimiento Vehiculos y Maquinaria',2,'compra de cauchos',500.00,1,500.00,3,'2025-12-16 11:20:09'),
(14,3,'2025-12-16',46,9,'Mantenimiento Vehiculos y Maquinaria',1,'compro caucho',15000.00,273.59,54.83,3,'2025-12-16 14:35:30'),
(15,3,'2025-12-17',17,85,'Combustibles',1,'compra de un tambor de gasolin',10000.00,279.56,35.77,3,'2025-12-18 08:46:52'),
(16,3,'2025-12-17',46,85,'Combustibles',2,'compra de gasoil 300 lt',40.00,1,40.00,3,'2025-12-18 16:40:14'),
(17,3,'2025-12-17',17,33,'Papeleria',1,'resmas de papel',12500.00,282.51,44.25,3,'2025-12-19 12:20:40'),
(19,3,'2025-12-19',29,9,'Mantenimiento Vehiculos y Maquinaria',1,'COMPRA DE ACEITE Y MANTENIMIENTO PARA MOTO DE MENSAJERIA',5650.00,282.51,20.00,6,'2025-12-20 16:01:46'),
(20,3,'2025-12-19',50,79,'Fletes Mercancia',1,'FLETES DE PROTECTORES EXCELINE',12720.00,282.51,45.02,3,'2025-12-20 16:51:02'),
(21,3,'2025-12-19',46,66,'Insumos ',1,'ARTICULOS DE LIMPIEZAS Y PAPELERIA',6120.00,282.51,21.66,3,'2025-12-20 16:54:22'),
(22,3,'2025-12-19',60,9,'Mantenimiento Vehiculos y Maquinaria',1,'LAVADO DE RUNNER',2820.00,282.51,9.98,3,'2025-12-20 16:55:29'),
(23,3,'2025-12-20',14,18,'Mercancia',1,'PAGO BICHITO PUERTAS V2 Y V3',27940.00,282.51,98.90,5,'2025-12-20 17:45:30'),
(24,3,'2025-12-20',17,85,'Combustibles',1,'GASOLINA MOTO MENSAJERO JUAN FERNANDEZ',1700.00,282.51,6.02,5,'2025-12-20 17:51:06'),
(25,3,'2025-12-20',17,33,'Papeleria',1,'FOTOCOPIAS DOCUMENTOS ',6960.00,282.51,24.64,5,'2025-12-20 17:51:32'),
(26,3,'2025-12-20',46,13,'Gastos Personales RABR',2,'PAGO SRA MARIA SERVICIO',60.00,1,60.00,5,'2025-12-20 17:55:26'),
(27,3,'2025-12-20',29,13,'Gastos Personales RABR',2,'NOMINA SRA MARIA LIMPIEZA',10.00,1,10.00,5,'2025-12-20 18:11:07'),
(28,3,'2025-12-20',29,13,'Gastos Personales RABR',1,'PASAJE SRA MARIA ',1420.00,282.51,5.03,5,'2025-12-20 18:11:22'),
(29,3,'2025-12-20',29,33,'Papeleria',1,'SOBRE DE MANILA PARA DOCUMENTOS',2400.00,282.51,8.50,5,'2025-12-20 18:11:46'),
(30,3,'2025-12-20',29,58,'Fletes',1,'FLETE EXTERNO YULIS TORRES 393779',2850.00,282.51,10.09,5,'2025-12-20 18:12:30'),
(31,3,'2025-12-20',60,18,'Mercancia',1,'COMPLEMENTO PAGO BICHITO PUERTAS V2 - V3',280.00,282.51,0.99,5,'2025-12-20 18:23:09'),
(32,3,'2025-12-20',50,58,'Fletes',1,'FLETE EXTERNO JOSE BARRIOS FACT 98418',5650.00,282.51,20.00,5,'2025-12-20 18:29:23');

/*Table structure for table `cuadre_arqueo_ingreso` */

DROP TABLE IF EXISTS `cuadre_arqueo_ingreso`;

CREATE TABLE `cuadre_arqueo_ingreso` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tipo_pago_id` bigint DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `empresa_id` bigint DEFAULT NULL,
  `monto` decimal(18,2) DEFAULT NULL,
  `valor_tasa` float DEFAULT NULL,
  `credito_calculado` decimal(18,2) DEFAULT NULL,
  `debito` decimal(18,2) DEFAULT NULL,
  `debito_calculado` decimal(18,2) DEFAULT NULL,
  `codusua` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

/*Data for the table `cuadre_arqueo_ingreso` */

insert  into `cuadre_arqueo_ingreso`(`id`,`tipo_pago_id`,`fecha`,`empresa_id`,`monto`,`valor_tasa`,`credito_calculado`,`debito`,`debito_calculado`,`codusua`,`created_at`,`updated_at`) values 
(45,1,'2025-12-11',3,NULL,270.79,NULL,5000.00,18.46,29,'2025-12-14 23:05:45','2025-12-14 23:05:45');

/*Table structure for table `cuadre_denominacion_efectivo` */

DROP TABLE IF EXISTS `cuadre_denominacion_efectivo`;

CREATE TABLE `cuadre_denominacion_efectivo` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` int DEFAULT NULL,
  `tipo_moneda` int DEFAULT NULL,
  `is_activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

/*Data for the table `cuadre_denominacion_efectivo` */

insert  into `cuadre_denominacion_efectivo`(`id`,`nombre`,`tipo_moneda`,`is_activo`,`created_at`,`updated_at`) values 
(1,10,1,1,'2025-12-10 12:09:47','2025-12-10 12:09:49'),
(2,20,1,1,'2025-12-10 12:09:43','2025-12-10 12:09:45'),
(4,50,1,1,'2025-12-10 12:10:21','2025-12-10 12:10:24'),
(5,100,1,1,'2025-12-10 12:10:26','2025-12-10 12:10:28'),
(6,200,1,1,'2025-12-10 12:10:31','2025-12-10 12:10:33'),
(7,1,2,1,'2025-12-10 12:10:31','2025-12-10 12:10:31'),
(8,5,2,1,'2025-12-10 12:10:31','2025-12-10 12:10:31'),
(9,10,2,1,'2025-12-10 12:10:31','2025-12-10 12:10:31'),
(10,20,2,1,'2025-12-10 12:10:31','2025-12-10 12:10:31'),
(11,50,2,1,'2025-12-10 12:10:31','2025-12-10 12:10:31'),
(12,100,2,1,'2025-12-10 12:10:31','2025-12-10 12:10:31'),
(14,500,1,1,'2025-12-20 17:42:53','2025-12-20 17:42:56');

/*Table structure for table `cuadre_efectivo_detallado` */

DROP TABLE IF EXISTS `cuadre_efectivo_detallado`;

CREATE TABLE `cuadre_efectivo_detallado` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `denominacion_id` bigint DEFAULT NULL,
  `denominacion` int DEFAULT NULL,
  `cantidad` decimal(18,2) DEFAULT NULL,
  `total` decimal(18,2) DEFAULT NULL,
  `valor_tasa` float DEFAULT NULL,
  `total_calculado` decimal(18,2) DEFAULT NULL,
  `codusua` bigint DEFAULT NULL,
  `tipo_moneda_id` bigint DEFAULT NULL,
  `tipo_pago_id` bigint DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

/*Data for the table `cuadre_efectivo_detallado` */

insert  into `cuadre_efectivo_detallado`(`id`,`empresa_id`,`fecha`,`denominacion_id`,`denominacion`,`cantidad`,`total`,`valor_tasa`,`total_calculado`,`codusua`,`tipo_moneda_id`,`tipo_pago_id`,`created_by`,`created_at`,`updated_at`) values 
(73,3,'2025-12-11',2,20,300.00,6000.00,NULL,NULL,29,1,1,NULL,NULL,NULL),
(74,3,'2025-12-11',4,50,100.00,5000.00,NULL,NULL,29,1,1,NULL,NULL,NULL),
(77,3,'2025-12-11',11,50,30.00,1500.00,NULL,NULL,29,3,2,NULL,NULL,NULL),
(79,3,'2025-12-11',12,100,2.00,200.00,1,200.00,29,3,2,NULL,NULL,NULL),
(81,3,'2025-12-11',1,10,70.00,700.00,270.79,2.59,29,1,1,NULL,'2025-12-15 09:52:03',NULL),
(82,3,'2025-12-11',10,20,12.00,240.00,1,240.00,29,3,2,3,'2025-12-15 10:00:52',NULL),
(83,4,'2025-12-11',2,20,70.00,1400.00,273.59,5.12,31,1,1,3,'2025-12-16 08:22:14',NULL),
(84,4,'2025-12-11',4,50,40.00,2000.00,273.59,7.31,31,1,1,3,'2025-12-16 08:22:14',NULL),
(85,4,'2025-12-11',10,20,10.00,200.00,1,200.00,31,3,2,3,'2025-12-16 08:22:35',NULL),
(86,4,'2025-12-11',11,50,10.00,500.00,1,500.00,31,3,2,3,'2025-12-16 08:22:35',NULL),
(87,3,'2025-12-16',2,20,50.00,1000.00,273.59,3.66,46,1,1,3,'2025-12-16 14:33:41',NULL),
(89,3,'2025-12-16',5,100,2.00,200.00,273.59,0.73,46,1,1,3,'2025-12-16 14:33:41',NULL),
(90,3,'2025-12-16',4,50,14.00,700.00,273.59,2.56,46,1,1,3,'2025-12-16 14:34:23',NULL),
(92,3,'2025-12-16',1,10,50.00,500.00,276.58,1.81,46,1,1,3,'2025-12-16 17:01:09',NULL),
(93,3,'2025-12-16',10,20,100.00,2000.00,1,2000.00,46,3,2,3,'2025-12-17 09:17:41',NULL),
(94,3,'2025-12-16',4,50,100.00,5000.00,276.58,18.08,50,1,1,3,'2025-12-17 10:25:51',NULL),
(95,3,'2025-12-16',5,100,50.00,5000.00,276.58,18.08,50,1,1,3,'2025-12-17 10:25:51',NULL),
(96,3,'2025-12-16',9,10,15.00,150.00,1,150.00,50,3,2,3,'2025-12-17 10:26:21',NULL),
(97,3,'2025-12-16',10,20,30.00,600.00,1,600.00,50,3,2,3,'2025-12-17 10:26:21',NULL),
(98,3,'2025-12-16',11,50,60.00,3000.00,1,3000.00,50,3,2,3,'2025-12-17 10:26:21',NULL),
(99,3,'2025-12-17',1,10,80.00,800.00,279.56,2.86,17,1,1,3,'2025-12-18 08:45:47',NULL),
(100,3,'2025-12-17',2,20,50.00,1000.00,279.56,3.58,17,1,1,3,'2025-12-18 08:45:47',NULL),
(101,3,'2025-12-17',4,50,2.00,100.00,279.56,0.36,17,1,1,3,'2025-12-18 08:45:47',NULL),
(102,3,'2025-12-17',8,5,2.00,10.00,1,10.00,17,3,2,3,'2025-12-18 08:46:06',NULL),
(103,3,'2025-12-17',9,10,20.00,200.00,1,200.00,17,3,2,3,'2025-12-18 08:46:06',NULL),
(104,3,'2025-12-17',10,20,60.00,1200.00,1,1200.00,17,3,2,3,'2025-12-18 08:46:06',NULL),
(105,3,'2025-12-17',11,50,5.00,250.00,1,250.00,17,3,2,3,'2025-12-18 08:46:06',NULL),
(106,3,'2025-12-17',5,100,3.00,300.00,279.56,1.07,46,1,1,3,'2025-12-18 16:38:51',NULL),
(107,3,'2025-12-17',12,100,5.00,500.00,1,500.00,46,3,2,3,'2025-12-18 16:38:58',NULL),
(114,3,'2025-12-19',1,10,306.00,3060.00,285.4,10.72,14,1,1,6,'2025-12-20 12:53:50',NULL),
(115,3,'2025-12-19',10,20,2.00,40.00,1,40.00,17,3,2,6,'2025-12-20 12:59:33',NULL),
(116,3,'2025-12-19',1,10,799.00,7990.00,285.4,28.00,17,1,1,6,'2025-12-20 12:59:43',NULL),
(119,3,'2025-12-19',1,10,404.00,4040.00,282.51,14.30,29,1,1,6,'2025-12-20 16:01:03',NULL),
(120,3,'2025-12-19',9,10,13.00,130.00,1,130.00,29,3,2,6,'2025-12-20 16:01:13',NULL),
(121,3,'2025-12-17',4,50,60.00,3000.00,276.57,10.85,29,1,1,3,'2025-12-20 16:29:55',NULL),
(123,3,'2025-12-17',6,200,20.00,4000.00,276.57,14.46,29,1,1,3,'2025-12-20 16:29:55',NULL),
(126,3,'2025-12-17',10,20,30.00,600.00,1,600.00,29,3,2,3,'2025-12-20 16:30:05',NULL),
(129,3,'2025-12-19',1,10,3122.00,31220.00,282.51,110.51,50,1,1,3,'2025-12-20 16:48:09',NULL),
(130,3,'2025-12-19',10,20,1.00,20.00,1,20.00,50,3,2,3,'2025-12-20 16:49:53',NULL),
(131,3,'2025-12-19',1,10,1200.00,12000.00,282.51,42.48,46,1,1,3,'2025-12-20 16:52:28',NULL),
(132,3,'2025-12-19',11,50,7.00,350.00,1,350.00,46,3,2,3,'2025-12-20 16:52:36',NULL),
(133,3,'2025-12-19',1,10,3346.00,33460.00,282.51,118.44,60,1,1,3,'2025-12-20 16:54:59',NULL),
(134,3,'2025-12-19',1,10,316.00,3160.00,282.51,11.19,62,1,1,3,'2025-12-20 16:58:53',NULL),
(135,3,'2025-12-19',7,1,170.00,170.00,1,170.00,62,3,2,3,'2025-12-20 16:59:07',NULL),
(138,3,'2025-12-20',1,10,1.00,10.00,282.51,0.04,14,1,1,5,'2025-12-20 17:44:59',NULL),
(139,3,'2025-12-20',5,100,2.00,200.00,282.51,0.71,14,1,1,5,'2025-12-20 17:44:59',NULL),
(140,3,'2025-12-20',14,500,1.00,500.00,282.51,1.77,14,1,1,5,'2025-12-20 17:44:59',NULL),
(141,3,'2025-12-20',1,10,129.00,1290.00,282.51,4.57,17,1,1,5,'2025-12-20 17:50:34',NULL),
(142,3,'2025-12-20',2,20,23.00,460.00,282.51,1.63,17,1,1,5,'2025-12-20 17:50:34',NULL),
(143,3,'2025-12-20',4,50,164.00,8200.00,282.51,29.03,17,1,1,5,'2025-12-20 17:50:34',NULL),
(144,3,'2025-12-20',5,100,125.00,12500.00,282.51,44.25,17,1,1,5,'2025-12-20 17:50:34',NULL),
(145,3,'2025-12-20',6,200,9.00,1800.00,282.51,6.37,17,1,1,5,'2025-12-20 17:50:34',NULL),
(146,3,'2025-12-20',14,500,3.00,1500.00,282.51,5.31,17,1,1,5,'2025-12-20 17:50:34',NULL),
(147,3,'2025-12-20',2,20,406.00,8120.00,282.51,28.74,46,1,1,5,'2025-12-20 17:54:21',NULL),
(148,3,'2025-12-20',4,50,145.00,7250.00,282.51,25.66,46,1,1,5,'2025-12-20 17:54:21',NULL),
(149,3,'2025-12-20',5,100,13.00,1300.00,282.51,4.60,46,1,1,5,'2025-12-20 17:54:21',NULL),
(150,3,'2025-12-20',6,200,5.00,1000.00,282.51,3.54,46,1,1,5,'2025-12-20 17:54:21',NULL),
(151,3,'2025-12-20',14,500,12.00,6000.00,282.51,21.24,46,1,1,5,'2025-12-20 17:54:21',NULL),
(152,3,'2025-12-20',9,10,1.00,10.00,1,10.00,46,3,2,5,'2025-12-20 17:54:40',NULL),
(153,3,'2025-12-20',12,100,4.00,400.00,1,400.00,46,3,2,5,'2025-12-20 17:54:40',NULL),
(154,3,'2025-12-20',2,20,177.00,3540.00,282.51,12.53,62,1,1,5,'2025-12-20 18:08:06',NULL),
(155,3,'2025-12-20',4,50,51.00,2550.00,282.51,9.03,62,1,1,5,'2025-12-20 18:08:06',NULL),
(156,3,'2025-12-20',5,100,30.00,3000.00,282.51,10.62,62,1,1,5,'2025-12-20 18:08:06',NULL),
(157,3,'2025-12-20',6,200,8.00,1600.00,282.51,5.66,62,1,1,5,'2025-12-20 18:08:06',NULL),
(158,3,'2025-12-20',8,5,1.00,5.00,1,5.00,62,3,2,5,'2025-12-20 18:08:12',NULL),
(159,3,'2025-12-20',1,10,4.00,40.00,282.51,0.14,62,1,1,5,'2025-12-20 18:08:18',NULL),
(160,3,'2025-12-20',1,10,153.00,1530.00,282.51,5.42,29,1,1,5,'2025-12-20 18:09:25',NULL),
(161,3,'2025-12-20',2,20,64.00,1280.00,282.51,4.53,29,1,1,5,'2025-12-20 18:09:25',NULL),
(162,3,'2025-12-20',4,50,24.00,1200.00,282.51,4.25,29,1,1,5,'2025-12-20 18:09:25',NULL),
(163,3,'2025-12-20',5,100,15.00,1500.00,282.51,5.31,29,1,1,5,'2025-12-20 18:09:25',NULL),
(164,3,'2025-12-20',6,200,7.00,1400.00,282.51,4.96,29,1,1,5,'2025-12-20 18:09:25',NULL),
(165,3,'2025-12-20',14,500,2.00,1000.00,282.51,3.54,29,1,1,5,'2025-12-20 18:09:25',NULL),
(166,3,'2025-12-20',9,10,1.00,10.00,1,10.00,29,3,2,5,'2025-12-20 18:09:45',NULL),
(167,3,'2025-12-20',10,20,3.00,60.00,1,60.00,29,3,2,5,'2025-12-20 18:09:45',NULL),
(168,3,'2025-12-20',1,10,37.00,370.00,282.51,1.31,60,1,1,5,'2025-12-20 18:22:29',NULL),
(169,3,'2025-12-20',2,20,719.00,14380.00,282.51,50.90,60,1,1,5,'2025-12-20 18:22:29',NULL),
(170,3,'2025-12-20',4,50,225.00,11250.00,282.51,39.82,60,1,1,5,'2025-12-20 18:22:29',NULL),
(171,3,'2025-12-20',7,1,4.00,4.00,1,4.00,60,3,2,5,'2025-12-20 18:22:40',NULL),
(172,3,'2025-12-20',9,10,1.00,10.00,1,10.00,60,3,2,5,'2025-12-20 18:22:40',NULL),
(173,3,'2025-12-20',10,20,1.00,20.00,1,20.00,60,3,2,5,'2025-12-20 18:22:40',NULL),
(174,3,'2025-12-20',9,10,1.00,10.00,1,10.00,50,3,2,5,'2025-12-20 18:27:54',NULL),
(175,3,'2025-12-20',1,10,15.00,150.00,282.51,0.53,50,1,1,5,'2025-12-20 18:28:08',NULL),
(176,3,'2025-12-20',4,50,3.00,150.00,282.51,0.53,50,1,1,5,'2025-12-20 18:28:08',NULL);

/*Table structure for table `cuenta_por_empresas_siace` */

DROP TABLE IF EXISTS `cuenta_por_empresas_siace`;

CREATE TABLE `cuenta_por_empresas_siace` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` int DEFAULT NULL,
  `tipo_pago_id` int DEFAULT NULL,
  `cont_cuenta_id` int DEFAULT NULL COMMENT 'codigo cuenta contable del siace segun la empresa',
  `nombre_cuenta` varchar(250) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

/*Data for the table `cuenta_por_empresas_siace` */

insert  into `cuenta_por_empresas_siace`(`id`,`empresa_id`,`tipo_pago_id`,`cont_cuenta_id`,`nombre_cuenta`) values 
(1,3,1,32,'Caja Bolivares'),
(2,3,2,31,'Caja Dolares '),
(3,4,1,4,'Caja Bolivares'),
(4,4,2,5,'Caja Dolares');

/*Table structure for table `empresas` */

DROP TABLE IF EXISTS `empresas`;

CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `rif` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `servidor` varchar(255) DEFAULT NULL,
  `puerto` varchar(5) DEFAULT NULL,
  `usuario_db` varchar(100) DEFAULT NULL,
  `clave` varchar(200) DEFAULT NULL,
  `basedatos` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ruc` (`rif`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `empresas` */

insert  into `empresas`(`id`,`nombre`,`rif`,`direccion`,`telefono`,`email`,`ciudad`,`estado`,`servidor`,`puerto`,`usuario_db`,`clave`,`basedatos`,`created_at`,`updated_at`) values 
(3,'Ferre Bloquera San Juan','J-29940170-6','San fernando','04144649934','ferresj@gmail.com','San Fernando','activo','10.10.1.5','3306','sauxcontrol','sauxcontrol','siace_facturacion_integral','2025-12-06 09:43:27','2025-12-15 08:43:04'),
(4,'FERRE HIERRO SAN JUAN, S.A','J-317464192','Av. intercomunal San Fernando Biruaca','0414-0000000','ferrehierro@gmail.com','San Fernando','activo','10.10.2.4','3306','sauxcontrol','Saux.18726146','siace_facturacion_integral','2025-12-16 08:17:58','2025-12-16 08:17:58');

/*Table structure for table `finanzas` */

DROP TABLE IF EXISTS `finanzas`;

CREATE TABLE `finanzas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `monto` decimal(12,2) NOT NULL,
  `fecha` date NOT NULL,
  `estado` enum('pendiente','completado','cancelado') DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `finanzas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `finanzas` */

/*Table structure for table `modulos` */

DROP TABLE IF EXISTS `modulos`;

CREATE TABLE `modulos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `icono` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `modulos` */

insert  into `modulos`(`id`,`nombre`,`descripcion`,`icono`) values 
(1,'Inicio','Dashboard principal','Home'),
(2,'Finanzas','Gestión de finanzas','DollarSign'),
(3,'Reportes','Reportes del sistema','BarChart3'),
(4,'Configuracion','Configuración del sistema','Settings');

/*Table structure for table `reportes_proveedores` */

DROP TABLE IF EXISTS `reportes_proveedores`;

CREATE TABLE `reportes_proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `nombre_proveedor` varchar(100) NOT NULL,
  `saldo_anterior` decimal(12,2) DEFAULT NULL,
  `movimientos` decimal(12,2) DEFAULT NULL,
  `saldo_actual` decimal(12,2) DEFAULT NULL,
  `fecha` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `reportes_proveedores_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `reportes_proveedores` */

/*Table structure for table `reportes_saldos` */

DROP TABLE IF EXISTS `reportes_saldos`;

CREATE TABLE `reportes_saldos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `cuenta` varchar(100) DEFAULT NULL,
  `saldo` decimal(12,2) DEFAULT NULL,
  `fecha` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `reportes_saldos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `reportes_saldos` */

/*Table structure for table `reportes_ventas` */

DROP TABLE IF EXISTS `reportes_ventas`;

CREATE TABLE `reportes_ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `total_ventas` decimal(12,2) DEFAULT NULL,
  `cantidad_transacciones` int DEFAULT NULL,
  `fecha` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `reportes_ventas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `reportes_ventas` */

/*Table structure for table `rol_permisos` */

DROP TABLE IF EXISTS `rol_permisos`;

CREATE TABLE `rol_permisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `modulo_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_rol_modulo` (`role_id`,`modulo_id`),
  KEY `modulo_id` (`modulo_id`),
  CONSTRAINT `rol_permisos_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rol_permisos_ibfk_2` FOREIGN KEY (`modulo_id`) REFERENCES `modulos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `rol_permisos` */

insert  into `rol_permisos`(`id`,`role_id`,`modulo_id`,`created_at`) values 
(1,1,1,'2025-12-01 21:16:47'),
(2,1,2,'2025-12-01 21:16:47'),
(3,1,3,'2025-12-01 21:16:47'),
(4,1,4,'2025-12-01 21:16:47'),
(5,2,1,'2025-12-01 21:16:47'),
(6,2,2,'2025-12-01 21:16:47'),
(7,2,3,'2025-12-01 21:16:47');

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `roles` */

insert  into `roles`(`id`,`nombre`,`descripcion`,`created_at`) values 
(1,'admin','Administrador del sistema','2025-12-01 21:16:47'),
(2,'usuario','Usuario normal','2025-12-01 21:16:47');

/*Table structure for table `tipo_moneda` */

DROP TABLE IF EXISTS `tipo_moneda`;

CREATE TABLE `tipo_moneda` (
  `keycodigo` int NOT NULL AUTO_INCREMENT,
  `nombre_singular` varchar(50) DEFAULT NULL,
  `nombre_plural` varchar(50) DEFAULT NULL,
  `abreviatura` varchar(20) DEFAULT NULL,
  `abreviatura_en_etiquetas` varchar(20) DEFAULT NULL,
  `codigo` varchar(3) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `is_nacional` tinyint(1) DEFAULT '0',
  `precio_anterior_monto` decimal(28,10) DEFAULT '0.0000000000',
  `precio_anterior_fecha` datetime DEFAULT NULL,
  `precio_compra_moneda_nacional` decimal(28,10) DEFAULT '0.0000000000',
  `precio_venta_moneda_nacional` decimal(28,10) DEFAULT '0.0000000000',
  `precio_actual_fecha` datetime DEFAULT NULL,
  `is_actualizar_precio_en_moneda_nacional` tinyint(1) DEFAULT '0',
  `is_activo` tinyint(1) DEFAULT '1',
  `is_nueva` tinyint(1) DEFAULT '0',
  `is_moneda_base` tinyint(1) DEFAULT '0',
  `is_imprimir_facturas_en_esta_moneda` tinyint(1) DEFAULT '0',
  `is_moneda_secundaria` tinyint(1) DEFAULT '0',
  `is_otra_tasa_visual_para_la_compra` tinyint(1) DEFAULT '0',
  `is_avance_de_efectivo` tinyint(1) DEFAULT '0',
  `precio_para_la_compra_monto_visual` decimal(28,10) DEFAULT '0.0000000000',
  `cant_decimales` int DEFAULT '2',
  `is_imprimir_referencia_al_cambio_facturacion` tinyint(1) DEFAULT '1',
  `is_actualizar_precios_en_base_utilidad` tinyint(1) DEFAULT '0',
  `codusua` int DEFAULT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `registrado` datetime DEFAULT NULL,
  `equipo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`keycodigo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;

/*Data for the table `tipo_moneda` */

insert  into `tipo_moneda`(`keycodigo`,`nombre_singular`,`nombre_plural`,`abreviatura`,`abreviatura_en_etiquetas`,`codigo`,`color`,`is_nacional`,`precio_anterior_monto`,`precio_anterior_fecha`,`precio_compra_moneda_nacional`,`precio_venta_moneda_nacional`,`precio_actual_fecha`,`is_actualizar_precio_en_moneda_nacional`,`is_activo`,`is_nueva`,`is_moneda_base`,`is_imprimir_facturas_en_esta_moneda`,`is_moneda_secundaria`,`is_otra_tasa_visual_para_la_compra`,`is_avance_de_efectivo`,`precio_para_la_compra_monto_visual`,`cant_decimales`,`is_imprimir_referencia_al_cambio_facturacion`,`is_actualizar_precios_en_base_utilidad`,`codusua`,`usuario`,`fecha`,`registrado`,`equipo`) values 
(1,'Bolivar','Bolivares','Bs',NULL,'VES','-128',1,262.1000000000,'2025-12-10 06:48:03',265.0600000000,265.0600000000,'2025-12-11 06:47:17',1,1,0,0,1,1,0,1,4.4600000000,2,1,0,NULL,NULL,NULL,NULL,NULL),
(3,'Dolar','Dolares','$',NULL,'USD','-8323200',0,5.4000000000,'2022-06-04 11:24:54',0.0000000000,0.0000000000,'2022-06-04 11:25:03',0,1,0,1,0,0,0,0,0.0000000000,2,1,0,9,'RAMON BEROES','2018-12-12','2018-12-12 00:00:00','Compras '),
(5,'Peso','Pesos','COP',NULL,'COP','',0,3830.0200000000,'2025-12-08 06:59:00',3861.3400000000,3861.3400000000,'2025-12-11 06:47:55',0,1,0,0,0,0,0,0,0.0000000000,2,1,0,9,'RAMON BEROES','2024-07-13','2024-07-13 00:00:00','RamonGerencia');

/*Table structure for table `tipo_pago` */

DROP TABLE IF EXISTS `tipo_pago`;

CREATE TABLE `tipo_pago` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombre_corto` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `is_efectivo` tinyint(1) DEFAULT '0',
  `is_moneda_nacional` tinyint(1) DEFAULT '0',
  `is_moneda_extranjera` tinyint(1) DEFAULT '0',
  `tipopago_siace_keycodigo` int DEFAULT '0',
  `codtipomoneda_siace` int DEFAULT '0',
  `is_aplicar_gastos` tinyint(1) DEFAULT '0',
  `is_activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

/*Data for the table `tipo_pago` */

insert  into `tipo_pago`(`id`,`nombre`,`nombre_corto`,`is_efectivo`,`is_moneda_nacional`,`is_moneda_extranjera`,`tipopago_siace_keycodigo`,`codtipomoneda_siace`,`is_aplicar_gastos`,`is_activo`,`created_at`,`updated_at`) values 
(1,'EFECTIVO Bs.','Bs',1,1,0,0,0,1,1,'2025-12-09 15:43:48','2025-12-09 15:43:54'),
(2,'EFECTIVO USD','USD',1,0,1,0,0,1,1,'2025-12-09 15:45:00','2025-12-09 15:45:04'),
(3,'TARJETA DE DEBITO','TDD',0,1,0,0,3,0,1,'2025-12-09 15:46:02','2025-12-09 15:46:06'),
(4,'TARJETA DE CREDITO','TDC',0,1,0,0,4,0,1,'2025-12-09 17:26:45','2025-12-09 17:26:48'),
(5,'TRANSFERENCIA','TR',0,1,0,0,10,0,1,'2025-12-09 17:27:45','2025-12-09 17:27:49'),
(6,'PAGO MOVIL','MOV',0,1,0,0,13,0,1,NULL,NULL),
(7,'BIO PAGO TDD','BIO TDD',0,1,0,0,14,0,1,NULL,NULL),
(8,'NOTA DEBITO','ND',0,1,0,0,16,0,1,NULL,NULL),
(9,'BIO PAGO PATRIA','BIOPA',0,1,0,0,19,0,1,NULL,NULL),
(10,'ZELLE','ZELLE',0,0,1,0,18,0,1,NULL,NULL);

/*Table structure for table `usuarios` */

DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `usuarios` */

insert  into `usuarios`(`id`,`nombre`,`email`,`contraseña`,`role_id`,`estado`,`created_at`,`updated_at`) values 
(1,'Administrador','admin@gruposanjuan.com','$2a$10$0kH8JUz0O6nF6r2e9Z9K3eN0M5P7Q3R6S8T9U0V1W2X3Y4Z5A6B7C',1,'activo','2025-12-01 21:16:47','2025-12-01 21:16:47'),
(2,'Juan Pérez','juan@gruposanjuan.com','$2a$10$1mN7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L',2,'activo','2025-12-01 21:16:47','2025-12-01 21:16:47'),
(3,'Jose Rivero','jarh18@gmail.com','18146211',1,'activo','2025-12-01 21:20:06','2025-12-01 21:20:06'),
(4,'Juan','juan@gmail.com','654321',1,'activo','2025-12-02 21:29:26','2025-12-02 22:48:07'),
(5,'Celestino','celestino@gmail.com','ae83xm',2,'activo','2025-12-19 16:29:05','2025-12-20 17:06:14'),
(6,'Ramon','ramon@gmail.com','123456',1,'activo','2025-12-20 12:13:17','2025-12-20 12:13:17');

/*Table structure for table `usuarios_empresas` */

DROP TABLE IF EXISTS `usuarios_empresas`;

CREATE TABLE `usuarios_empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_usuario_empresa` (`usuario_id`,`empresa_id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `usuarios_empresas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `usuarios_empresas_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `usuarios_empresas` */

insert  into `usuarios_empresas`(`id`,`usuario_id`,`empresa_id`,`created_at`) values 
(14,3,3,'2025-12-16 08:18:49'),
(15,3,4,'2025-12-16 08:18:49'),
(16,2,4,'2025-12-19 15:53:15'),
(17,1,3,'2025-12-19 15:53:28'),
(18,1,4,'2025-12-19 15:53:28'),
(20,4,3,'2025-12-19 16:41:01'),
(21,4,4,'2025-12-19 16:41:01'),
(22,6,3,'2025-12-20 12:13:17'),
(23,6,4,'2025-12-20 12:13:17'),
(24,5,3,'2025-12-20 17:06:14');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
