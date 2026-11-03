-- =====================================================================
--  AGUAS JUSTAS — Lecturas propuestas sobre la base
--  Se carga DESPUÉS de 01_aguas_justas.sql.
--
--  Nada de esto estaba en la base original: son criterios de análisis
--  propuestos para el tablero, pensados para que el grupo los revise y
--  los corrija. Cada tabla dice de dónde sale lo que guarda.
-- =====================================================================

SET NAMES utf8mb4;
USE aguas_justas;

-- ---------------------------------------------------------------------
-- 1. Ubicación de los lugares en el mapa (WGS84)
--    centro_localidad : coordenada pública de la localidad
--    zona_aproximada  : área estimada; se dibuja como un círculo de radio_m
--    sin_ubicar       : no hay datos para ubicarlo; se lista aparte
-- ---------------------------------------------------------------------
CREATE TABLE lugar_ubicacion (
    id_lugar            INT PRIMARY KEY,
    lat                 DECIMAL(9,6) NULL,
    lng                 DECIMAL(9,6) NULL,
    precision_ubicacion ENUM('centro_localidad','zona_aproximada','sin_ubicar') NOT NULL,
    radio_m             INT NULL,
    localidad           VARCHAR(80) NULL,
    nota                VARCHAR(300) NULL,
    CONSTRAINT chk_ubicacion CHECK (
        (precision_ubicacion = 'sin_ubicar' AND lat IS NULL AND lng IS NULL)
        OR (precision_ubicacion <> 'sin_ubicar' AND lat IS NOT NULL AND lng IS NOT NULL)),
    FOREIGN KEY (id_lugar) REFERENCES lugar(id_lugar) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO lugar_ubicacion (id_lugar, lat, lng, precision_ubicacion, radio_m, localidad, nota) VALUES
(1,  -31.462000, -64.520000, 'zona_aproximada',  1800, NULL,                      'Tramo donde el río es el límite entre San Antonio de Arredondo y Villa Carlos Paz. Posición estimada.'),
(2,  -31.484200, -64.533300, 'centro_localidad', NULL, 'San Antonio de Arredondo', 'Coordenada de la localidad.'),
(3,  -31.420000, -64.500000, 'centro_localidad', NULL, 'Villa Carlos Paz',         'Coordenada del centro de la ciudad.'),
(4,  -31.472000, -64.542000, 'centro_localidad', NULL, 'Mayu Sumaj',               'Coordenada de la localidad.'),
(5,  -31.378060, -64.469440, 'centro_localidad', NULL, NULL,                       'Centro del embalse.'),
(6,  NULL,       NULL,       'sin_ubicar',       NULL, NULL,                       'E2 no precisa el lugar: "antes de llegar a Carlos Paz". Georreferenciar en la próxima salida.'),
(7,  -31.470000, -64.525000, 'zona_aproximada',   700, 'San Antonio de Arredondo', 'Barrio cerrado en el corredor San Antonio de Arredondo–Villa Carlos Paz. Ubicación estimada.'),
(8,  -31.445000, -64.512000, 'zona_aproximada',   600, 'Villa Carlos Paz',         'Balneario Playas de Oro, sobre el río San Antonio (Av. Perito Moreno). Ubicación estimada.'),
(9,  -31.453000, -64.516000, 'zona_aproximada',  1200, 'Villa Carlos Paz',         'E4 no nombra el balneario; se ubica en el tramo límite. Confirmar cuál es.'),
(10, -31.490000, -64.560000, 'zona_aproximada',  2500, NULL,                       'Río arriba de San Antonio de Arredondo (zona de Icho Cruz y Tala Huasi). Zona estimada.'),
(11, -31.245000, -64.465600, 'zona_aproximada',  4000, 'Cosquín',                  'Marcado en Cosquín; La Falda está más al norte. Llegan al lago por el río Cosquín, no por el San Antonio.'),
(12, NULL,       NULL,       'sin_ubicar',       NULL, NULL,                       'Entre un camping y un barrio privado. Georreferenciar en la próxima salida.'),
(13, NULL,       NULL,       'sin_ubicar',       NULL, 'San Antonio de Arredondo', 'Falta la dirección del predio.'),
(14, NULL,       NULL,       'sin_ubicar',       NULL, NULL,                       'Falta confirmar en qué localidad está esta costanera.'),
(15, NULL,       NULL,       'sin_ubicar',       NULL, 'San Antonio de Arredondo', 'Bordea el río; falta el trazado exacto.');

-- ---------------------------------------------------------------------
-- 2. Cruce entre los ejes municipales (M1–M5) y los temas de entrevistas
-- ---------------------------------------------------------------------
CREATE TABLE eje_tema (
    id_pregunta INT NOT NULL,
    id_tema     INT NOT NULL,
    PRIMARY KEY (id_pregunta, id_tema),
    FOREIGN KEY (id_pregunta) REFERENCES pregunta(id_pregunta),
    FOREIGN KEY (id_tema)     REFERENCES tema(id_tema)
) ENGINE=InnoDB;

INSERT INTO eje_tema (id_pregunta, id_tema) VALUES
(10,15),(10,16),(10,17),          -- M1 competencias: limpieza municipal, vecinos que limpian, deslinde
(11,20),(11,21),                  -- M2 personal y presupuesto: presupuesto, cobros
(12,18),(12,19),(12,22),(12,23),  -- M3 ordenanzas y control: reclamos, multas, planificación, monitoreo
(13,6),(13,7),(13,17),            -- M4 coordinación: río arriba, lago, deslinde
(14,1),(14,11),(14,12),(14,13),(14,14); -- M5 infraestructura: cloacas, asadores, baños, cartelería, alumbrado

-- ---------------------------------------------------------------------
-- 3. Tensiones: preguntas donde las entrevistas se contradicen
-- ---------------------------------------------------------------------
CREATE TABLE tension (
    id_tension INT PRIMARY KEY,
    codigo     VARCHAR(4)   NOT NULL UNIQUE,
    titulo     VARCHAR(150) NOT NULL,
    polo_a     VARCHAR(150) NOT NULL,
    polo_b     VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE tension_respuesta (
    id_tension   INT NOT NULL,
    id_respuesta INT NOT NULL,
    polo         ENUM('A','B') NOT NULL,
    PRIMARY KEY (id_tension, id_respuesta, polo),
    FOREIGN KEY (id_tension)   REFERENCES tension(id_tension) ON DELETE CASCADE,
    FOREIGN KEY (id_respuesta) REFERENCES respuesta(id_respuesta) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tension_hallazgo (
    id_tension  INT NOT NULL,
    id_hallazgo INT NOT NULL,
    PRIMARY KEY (id_tension, id_hallazgo),
    FOREIGN KEY (id_tension)  REFERENCES tension(id_tension) ON DELETE CASCADE,
    FOREIGN KEY (id_hallazgo) REFERENCES hallazgo(id_hallazgo) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO tension (id_tension, codigo, titulo, polo_a, polo_b) VALUES
(1, 'T1', '¿Quién se ocupa de limpiar el río?',               'El municipio limpia',                             'Lo hacen los vecinos, o nadie'),
(2, 'T2', '¿De dónde viene la contaminación?',                'De afuera: río arriba, Carlos Paz u otras zonas', 'De acá: hogares, visitantes y falta de cloacas'),
(3, 'T3', 'Los turistas, ¿causa o síntoma?',                  'Los visitantes ensucian',                         'El problema es la gestión, no el turista'),
(4, 'T4', '¿El río está mejor o peor que antes?',             'Mejoró',                                          'Empeoró o se estancó'),
(5, 'T5', '¿Concientizar o sancionar?',                       'Educación y concientización',                     'Control y sanciones'),
(6, 'T6', 'Carlos Paz y San Antonio: ¿de quién es el río?',   'Cada lado responde por su margen',                'Se pasan la responsabilidad');

INSERT INTO tension_respuesta (id_tension, id_respuesta, polo) VALUES
(1,405,'A'),(1,410,'A'),(1,411,'A'),(1,704,'A'),(1,504,'A'),
(1,104,'B'),(1,105,'B'),(1,205,'B'),(1,304,'B'),(1,305,'B'),(1,505,'B'),(1,604,'B'),(1,605,'B'),(1,703,'B'),(1,804,'B'),(1,805,'B'),
(2,207,'A'),(2,307,'A'),(2,607,'A'),(2,303,'A'),
(2,106,'B'),(2,107,'B'),(2,203,'B'),(2,503,'B'),(2,506,'B'),(2,703,'B'),(2,706,'B'),
(3,207,'A'),(3,306,'A'),(3,506,'A'),(3,806,'A'),(3,706,'A'),
(3,603,'B'),(3,309,'B'),(3,604,'B'),(3,609,'B'),
(4,302,'A'),(4,504,'A'),
(4,602,'B'),(4,606,'B'),(4,702,'B'),(4,709,'B'),
(5,508,'A'),(5,504,'A'),
(5,706,'B'),(5,704,'B'),(5,304,'B'),
(6,410,'A'),(6,405,'A'),(6,414,'A'),
(6,504,'B'),(6,508,'B'),(6,708,'B');

INSERT INTO tension_hallazgo (id_tension, id_hallazgo) VALUES
(1,5),(2,12),(2,9),(4,1),(4,2),(6,8);
