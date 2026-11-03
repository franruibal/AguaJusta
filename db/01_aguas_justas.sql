-- =====================================================================
--  AGUAS JUSTAS — Base de datos de relevamiento del río San Antonio
--  (San Antonio de Arredondo / Villa Carlos Paz)
--  Fuente: "ENTREGABLES_1" — Salidas de campo N°1, N°2 y N°3 (Grupo 1)
--  Motor: MySQL 8.0+ (compatible con MariaDB 10.5+)
--  Criterio: las PREGUNTAS son las variables comunes; cada entrevista
--  carga su respuesta a cada pregunta. La Salida 3 (relevamiento
--  documental) se ordena por las 5 preguntas del módulo municipal.
-- =====================================================================

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS aguas_justas;
CREATE DATABASE aguas_justas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aguas_justas;

-- ---------------------------------------------------------------------
-- 1. ESTRUCTURA
-- ---------------------------------------------------------------------

CREATE TABLE salida_campo (
    id_salida     INT AUTO_INCREMENT PRIMARY KEY,
    numero        TINYINT      NOT NULL UNIQUE,
    fecha         DATE         NULL,
    tipo          ENUM('entrevistas','documental') NOT NULL,
    grupo         VARCHAR(30)  NOT NULL DEFAULT 'Grupo 1',
    descripcion   VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE pregunta (
    id_pregunta   INT AUTO_INCREMENT PRIMARY KEY,
    codigo        VARCHAR(5)   NOT NULL UNIQUE,
    modulo        ENUM('vecinos','municipal') NOT NULL,
    orden         TINYINT      NOT NULL,
    texto         VARCHAR(400) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE entrevistado (
    id_entrevistado     INT AUTO_INCREMENT PRIMARY KEY,
    id_salida           INT          NOT NULL,
    codigo              VARCHAR(5)   NOT NULL UNIQUE,
    perfil              VARCHAR(120) NOT NULL,
    genero              ENUM('femenino','masculino','mixto','no_especificado') NOT NULL DEFAULT 'no_especificado',
    edad                TINYINT UNSIGNED NULL,
    cantidad_personas   TINYINT UNSIGNED NOT NULL DEFAULT 1,
    condicion           ENUM('residente','trabajador','empleado_municipal','turista') NOT NULL,
    localidad_residencia VARCHAR(80) NULL,
    antiguedad          VARCHAR(80)  NULL,
    observaciones       VARCHAR(400) NULL,
    CONSTRAINT fk_entrevistado_salida FOREIGN KEY (id_salida)
        REFERENCES salida_campo(id_salida)
) ENGINE=InnoDB;

CREATE TABLE respuesta (
    id_respuesta     INT AUTO_INCREMENT PRIMARY KEY,
    id_entrevistado  INT  NOT NULL,
    id_pregunta      INT  NOT NULL,
    texto            TEXT NOT NULL,
    origen           ENUM('directa','reconstruida') NOT NULL,
    CONSTRAINT uq_respuesta UNIQUE (id_entrevistado, id_pregunta),
    CONSTRAINT fk_respuesta_entrevistado FOREIGN KEY (id_entrevistado)
        REFERENCES entrevistado(id_entrevistado) ON DELETE CASCADE,
    CONSTRAINT fk_respuesta_pregunta FOREIGN KEY (id_pregunta)
        REFERENCES pregunta(id_pregunta)
) ENGINE=InnoDB;

CREATE TABLE tema (
    id_tema     INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(80) NOT NULL UNIQUE,
    categoria   ENUM('contaminacion','gestion','infraestructura','seguridad','ambiente','social') NOT NULL
) ENGINE=InnoDB;

CREATE TABLE lugar (
    id_lugar    INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    tipo        ENUM('curso_agua','localidad','barrio','balneario','predio','sitio') NOT NULL,
    referencia  VARCHAR(200) NULL
) ENGINE=InnoDB;

CREATE TABLE respuesta_tema (
    id_respuesta INT NOT NULL,
    id_tema      INT NOT NULL,
    PRIMARY KEY (id_respuesta, id_tema),
    FOREIGN KEY (id_respuesta) REFERENCES respuesta(id_respuesta) ON DELETE CASCADE,
    FOREIGN KEY (id_tema)      REFERENCES tema(id_tema)
) ENGINE=InnoDB;

CREATE TABLE respuesta_lugar (
    id_respuesta INT NOT NULL,
    id_lugar     INT NOT NULL,
    PRIMARY KEY (id_respuesta, id_lugar),
    FOREIGN KEY (id_respuesta) REFERENCES respuesta(id_respuesta) ON DELETE CASCADE,
    FOREIGN KEY (id_lugar)     REFERENCES lugar(id_lugar)
) ENGINE=InnoDB;

CREATE TABLE fuente (
    id_fuente   INT AUTO_INCREMENT PRIMARY KEY,
    titulo      VARCHAR(200) NOT NULL,
    medio       VARCHAR(100) NOT NULL,
    tipo        ENUM('oficial_municipal','oficial_provincial','prensa','normativa') NOT NULL,
    fecha       DATE NULL
) ENGINE=InnoDB;

CREATE TABLE hallazgo (
    id_hallazgo  INT AUTO_INCREMENT PRIMARY KEY,
    id_salida    INT  NOT NULL,
    id_pregunta  INT  NULL,
    id_fuente    INT  NULL,
    id_lugar     INT  NULL,
    tipo         ENUM('documental','observacion_campo') NOT NULL,
    titulo       VARCHAR(150) NOT NULL,
    descripcion  TEXT NOT NULL,
    monto        DECIMAL(15,2) NULL,
    fecha        DATE NULL,
    estado       ENUM('anunciado','en_ejecucion','inaugurado','vigente','realizado','sin_dato','sin_verificar','observado') NOT NULL,
    FOREIGN KEY (id_salida)   REFERENCES salida_campo(id_salida),
    FOREIGN KEY (id_pregunta) REFERENCES pregunta(id_pregunta),
    FOREIGN KEY (id_fuente)   REFERENCES fuente(id_fuente),
    FOREIGN KEY (id_lugar)    REFERENCES lugar(id_lugar)
) ENGINE=InnoDB;

CREATE TABLE hallazgo_tema (
    id_hallazgo INT NOT NULL,
    id_tema     INT NOT NULL,
    PRIMARY KEY (id_hallazgo, id_tema),
    FOREIGN KEY (id_hallazgo) REFERENCES hallazgo(id_hallazgo) ON DELETE CASCADE,
    FOREIGN KEY (id_tema)     REFERENCES tema(id_tema)
) ENGINE=InnoDB;

CREATE TABLE dato_pendiente (
    id_pendiente INT AUTO_INCREMENT PRIMARY KEY,
    id_pregunta  INT NULL,
    id_hallazgo  INT NULL,
    descripcion  VARCHAR(300) NOT NULL,
    CONSTRAINT chk_pendiente_origen CHECK ((id_pregunta IS NULL) <> (id_hallazgo IS NULL)),
    FOREIGN KEY (id_pregunta) REFERENCES pregunta(id_pregunta),
    FOREIGN KEY (id_hallazgo) REFERENCES hallazgo(id_hallazgo)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. DATOS
-- ---------------------------------------------------------------------
INSERT INTO salida_campo (id_salida, numero, fecha, tipo, descripcion) VALUES
(1, 1, '2026-08-30', 'entrevistas', 'Entrevistas abiertas (relato), sin cuestionario estructurado'),
(2, 2, NULL,         'entrevistas', 'Entrevistas con cuestionario + observación del arroyo con efluentes'),
(3, 3, NULL,         'documental',  'Relevamiento documental 2026 – Río San Antonio');

INSERT INTO pregunta (id_pregunta, codigo, modulo, orden, texto) VALUES
(1,  'P1', 'vecinos', 1, '¿Es residente o turista de San Antonio? ¿Hace cuánto vive/trabaja/visita San Antonio?'),
(2,  'P2', 'vecinos', 2, '¿Notó algún cambio en el último tiempo en el estado del río? En caso de que sí lo haya hecho, ¿cuándo y qué cambió?'),
(3,  'P3', 'vecinos', 3, '¿Cuáles son los principales problemas que ve en el río? ¿En qué lugares?'),
(4,  'P4', 'vecinos', 4, '¿Quiénes se ocupan hoy del río? ¿Quiénes consideras que deberían hacerlo? ¿Consideras que hay tensiones con la Municipalidad acerca del estado del río?'),
(5,  'P5', 'vecinos', 5, 'Tenemos conocimiento de que se han organizado los vecinos para limpiar el río. ¿Cómo se organizan, quiénes y cuántos son?'),
(6,  'P6', 'vecinos', 6, '¿Qué cambia entre verano e invierno (crecidas, afluencia, basura, seguridad, sequía)?'),
(7,  'P7', 'vecinos', 7, '¿Cuál crees que es la causa de ese cambio? (los locales, los turistas, lo que viene río arriba, Carlos Paz) ¿Consideran que está contaminado?'),
(8,  'P8', 'vecinos', 8, '¿Realizaron reclamos, campañas o acuerdos para mejorar la situación? Si esto pasó, ¿qué resultó y por qué?'),
(9,  'P9', 'vecinos', 9, '¿Hay algo importante que no preguntamos? ¿Algún comentario?'),
(10, 'M1', 'municipal', 1, '¿Qué competencias tiene sobre el cauce y la limpieza? (Es decir, hasta dónde son los límites de los cuales se ocupan del río)'),
(11, 'M2', 'municipal', 2, '¿Tiene conocimiento de la cantidad de personal y presupuesto que hay? ¿Varía con la temporada?'),
(12, 'M3', 'municipal', 3, '¿Tiene conocimiento de las ordenanzas que rigen y cómo se controlan?'),
(13, 'M4', 'municipal', 4, '¿Cómo se coordinan con los otros municipios con los que comparten el río? ¿Y con la Provincia?'),
(14, 'M5', 'municipal', 5, '¿Con qué infraestructuras cuentan? (asadores, baños, cloacas)');

INSERT INTO tema (id_tema, nombre, categoria) VALUES
(1,  'Cloacas y efluentes cloacales',               'contaminacion'),
(2,  'Basura y residuos sólidos en el río',          'contaminacion'),
(3,  'Basura dejada por turistas/visitantes',        'contaminacion'),
(4,  'Vaciado de piletas y lavarropas (cloro)',      'contaminacion'),
(5,  'Vertidos de hoteles, restaurantes y barrios privados', 'contaminacion'),
(6,  'Contaminación que llega desde río arriba',     'contaminacion'),
(7,  'Algas y contaminación del lago',               'contaminacion'),
(8,  'Crecidas',                                     'ambiente'),
(9,  'Fuego, asados en el piso e incendios',         'ambiente'),
(10, 'Flora autóctona y humedales',                  'ambiente'),
(11, 'Asadores',                                     'infraestructura'),
(12, 'Baños, estacionamiento y servicios',           'infraestructura'),
(13, 'Cartelería y tachos de basura',                'infraestructura'),
(14, 'Alumbrado público',                            'infraestructura'),
(15, 'Limpieza municipal',                           'gestion'),
(16, 'Vecinos que limpian / organización vecinal',   'social'),
(17, 'Deslinde de responsabilidades entre jurisdicciones', 'gestion'),
(18, 'Reclamos sin respuesta',                       'gestion'),
(19, 'Multas, inspección y control',                 'gestion'),
(20, 'Presupuesto y uso de fondos',                  'gestion'),
(21, 'Cobros (estacionamiento, asadores)',           'gestion'),
(22, 'Planificación y ordenamiento ambiental',       'gestion'),
(23, 'Monitoreo de calidad del agua',                'gestion'),
(24, 'Estacionalidad (verano/invierno)',             'social'),
(25, 'Inseguridad y robos',                          'seguridad'),
(26, 'Salud (afecciones atribuidas al agua)',        'social'),
(27, 'Amenazas a vecinos que denuncian',             'seguridad');

INSERT INTO lugar (id_lugar, nombre, tipo, referencia) VALUES
(1,  'Río San Antonio',                     'curso_agua', 'Límite entre Carlos Paz (margen derecha) y San Antonio de Arredondo (margen izquierda)'),
(2,  'San Antonio de Arredondo',            'localidad',  NULL),
(3,  'Villa Carlos Paz',                    'localidad',  'Restaurantes, hoteles y casino mencionados como fuentes de contaminación'),
(4,  'Mayu Sumaj',                          'localidad',  'De donde vienen las crecidas, según E1'),
(5,  'Lago San Roque',                      'curso_agua', 'Desembocadura; formación de algas'),
(6,  'Asentamiento cerca de un hospital',   'sitio',      'Zona baja antes de llegar a Carlos Paz, viviendas precarias (según E2)'),
(7,  'Barrio El Dorado 2',                  'barrio',     'Límite Carlos Paz–San Antonio; líquidos cloacales al río (E6, E7)'),
(8,  'Playa de Oro',                        'balneario',  'De donde se sacaron los asadores (E7)'),
(9,  'Balneario público de Carlos Paz',     'balneario',  'Tiene asadores, baños y estacionamiento (E4)'),
(10, 'Campamentos río arriba',              'sitio',      'Origen de basura arrastrada por la corriente (E3)'),
(11, 'Cosquín y La Falda',                  'localidad',  'Mencionados por E6 como zona que vierte residuos'),
(12, 'Arroyo entre camping y barrio privado','sitio',     'Instalación de bombeo y agua de características cloacales (observación Salida 2)'),
(13, 'Predio Los Algarrobos',               'predio',     'Baños y vestuarios refuncionalizados en 2026'),
(14, 'Costanera (Héroes de Malvinas y Ardiles)', 'sitio', 'Punto Verde Municipal'),
(15, 'Sendero del Río',                     'sitio',      'Sendero que bordea el río, en puesta en valor');

INSERT INTO entrevistado (id_entrevistado, id_salida, codigo, perfil, genero, edad, cantidad_personas, condicion, localidad_residencia, antiguedad, observaciones) VALUES
(1, 1, 'E1', 'Vecina',                                   'femenino',        50,   1, 'residente',          'San Antonio de Arredondo', NULL, NULL),
(2, 1, 'E2', 'Guardia urbano (Ministerio de Seguridad)', 'masculino',       NULL, 1, 'trabajador',         NULL, 'Trabaja en la zona hace más de 10 años', 'No vive en San Antonio'),
(3, 1, 'E3', 'Pareja de vecinos',                        'no_especificado', 21,   2, 'residente',          'San Antonio de Arredondo', NULL, 'Ambos de 21 años; una integra un grupo de vecinos que limpia'),
(4, 1, 'E4', 'Empleada municipal, encargada de baños del balneario público', 'femenino', NULL, 1, 'empleado_municipal', NULL, NULL, 'Trabaja para Carlos Paz: su relato puede favorecer la gestión de su jurisdicción'),
(5, 2, 'E5', 'Hermano franciscano',                      'masculino',       NULL, 1, 'residente',          'San Antonio de Arredondo', 'Hace mucho (es de Mendoza)', 'Parroquia franciscana organiza jornada ambiental'),
(6, 2, 'E6', 'Pareja de vecinos',                        'no_especificado', NULL, 2, 'residente',          'San Antonio de Arredondo', 'Hace 30 años (vinieron de Córdoba Capital)', NULL),
(7, 2, 'E7', 'Madre e hijo',                             'mixto',           NULL, 2, 'residente',          'San Antonio de Arredondo', 'Desde 2014', 'Denuncia haber recibido amenazas por reclamar'),
(8, 2, 'E8', 'Farmacéutica',                             'femenino',        NULL, 1, 'trabajador',         'Villa Carlos Paz', NULL, 'Trabaja en San Antonio; no frecuenta mucho el río');

INSERT INTO respuesta (id_respuesta, id_entrevistado, id_pregunta, texto, origen) VALUES
(103, 1, 3, 'El río está muy sucio: el agua queda llena de mugre y basura que no se retira. Hay riesgo de incendio porque la gente hace fogatas y asados improvisados en la vegetación en época de sequía.', 'reconstruida'),
(104, 1, 4, 'La municipalidad limpia las calles y la zona de asadores (afuera del río), pero no el curso de agua ni sus orillas. Falta una política ambiental clara y sostenida; el municipio debería involucrarse más.', 'reconstruida'),
(105, 1, 5, 'Según le contó una vecina, hay un grupo de vecinos que se compromete y limpia el lugar por su cuenta; no es personal municipal ni una empresa contratada.', 'reconstruida'),
(106, 1, 6, 'Las crecidas arrastran mucha suciedad. Al terminar la temporada se vacía hacia el río el agua de piletas y lavarropas.', 'reconstruida'),
(107, 1, 7, 'En un balneario cercano sacaron los asadores: hay mucha demanda y poca oferta, y la gente termina haciendo fuego en la vegetación. Las crecidas vienen de Mayu Sumaj. El agua de piletas y lavarropas con cloro y químicos contamina el río.', 'reconstruida'),
(201, 2, 1, 'Es guardia urbano del Ministerio de Seguridad (policía local de San Antonio). No vive en San Antonio, pero trabaja en la zona hace más de diez años.', 'reconstruida'),
(203, 2, 3, 'Crecidas muy fuertes en verano que a veces obligan a evacuar. Restaurantes que tiran basura y vecinos que vacían piletas con cloro. No hay carteles que indiquen no tirar basura y los tachos no tienen bolsa.', 'reconstruida'),
(205, 2, 5, 'Los vecinos incluso toman la iniciativa de limpiar por su cuenta.', 'reconstruida'),
(206, 2, 6, 'En verano, por la temporada de lluvias, las crecidas son muy fuertes y en ocasiones hay que evacuar a la gente.', 'reconstruida'),
(207, 2, 7, 'La contaminación viene más de afuera que de los vecinos: el río nace al norte y pasa por un asentamiento precario cerca de un hospital donde tiran residuos y ropa; luego se suman restaurantes, hoteles y el casino de Carlos Paz. Ensucian más los visitantes de día. El agua llega al lago y favorece las algas. En San Antonio los vecinos no se quejan tanto; el problema más grave está en Carlos Paz.', 'reconstruida'),
(302, 3, 2, 'En los últimos años notaron que mejoró el cuidado del río, aunque no saben fechas concretas; es una impresión general.', 'reconstruida'),
(303, 3, 3, 'Barrios privados y hoteles vierten desechos al río; es un daño que no siempre se ve, por lo que proponen un estudio de toxicidad del agua. Se construyeron cloacas en la zona pero no se usan.', 'reconstruida'),
(304, 3, 4, 'En teoría la limpieza debería estar a cargo de la municipalidad, pero en general son los vecinos organizados quienes se hacen cargo. La respuesta no puede depender solo del municipio: hace falta también intervención policial.', 'reconstruida'),
(305, 3, 5, 'Una de las entrevistadas forma parte de un grupo de vecinos que se dedica a la limpieza del río.', 'reconstruida'),
(306, 3, 6, 'En verano llega mucha más gente y turistas: aumentan el riesgo de incendios, la basura, los robos y la inseguridad. Los recursos de limpieza son los mismos todo el año: en invierno alcanzan más o menos, en verano no.', 'reconstruida'),
(307, 3, 7, 'Buena parte de la mugre viene de campamentos río arriba y llega arrastrada por la corriente (contaminación \"residual\"), además de barrios privados y hoteles. Podría agravarse a futuro.', 'reconstruida'),
(309, 3, 9, 'No proponen cupos para turistas, pero consideran que hay una explotación excesiva del río: si va a venir tanta gente, debe acompañarse de mayor cuidado. Requiere un trabajo interdisciplinario.', 'reconstruida'),
(401, 4, 1, 'Trabaja para el municipio de Carlos Paz, a cargo de los baños del balneario público.', 'reconstruida'),
(405, 4, 5, 'Del lado de Carlos Paz no existe ningún grupo de vecinos que limpie el río: el municipio hace toda esa tarea.', 'reconstruida'),
(410, 4, 10, 'Ese tramo del río funciona como límite: hacia la derecha es jurisdicción de Carlos Paz y hacia la izquierda de San Antonio de Arredondo. Del lado de Carlos Paz, la limpieza la hace el municipio.', 'reconstruida'),
(411, 4, 11, 'En temporada baja hay menos personal asignado a la limpieza; en temporada alta el municipio refuerza el equipo.', 'reconstruida'),
(414, 4, 14, 'Del lado de Carlos Paz hay asadores, baños y estacionamiento; del lado de San Antonio no hay infraestructura equivalente.', 'reconstruida'),
(501, 5, 1, 'Es residente. Es de Mendoza, pero vive hace mucho en San Antonio.', 'directa'),
(503, 5, 3, 'El tema cloacal, que termina afectando a la flora del pueblo.', 'directa'),
(504, 5, 4, 'Ve acción del Municipio de San Antonio, pero hay muchas tensiones: se tiran la pelota entre municipio y provincia (\"esto es cuestión provincial / municipal\"). El Municipio puso carteles (\"cuidemos el río\"), señalizó humedales y plantó flora autóctona (algarrobos, quebrachos) donde había flora invasiva. Está preparando un proyecto de saneamiento: las cloacas son el principal problema.', 'directa'),
(505, 5, 5, 'Más allá de las tensiones y la acción del Municipio, hay más accionar de los vecinos: actualmente son los que más se encargan del cuidado y saneamiento del río.', 'directa'),
(506, 5, 6, 'En verano o fines de semana largos, la basura que dejan los turistas se suma a la contaminación de las cloacas.', 'directa'),
(508, 5, 8, 'Ante los reclamos se tiran la pelota y no se hacen responsables. La parroquia franciscana hará una jornada por San Francisco con foco ambiental para concientizar sobre el cuidado del ambiente, la flora y la fauna.', 'directa'),
(601, 6, 1, 'Residentes hace 30 años; vinieron de Córdoba Capital. Tenían una casa de fin de semana, la arreglaron y se mudaron.', 'directa'),
(602, 6, 2, 'Hasta hace 10 años había cambios. En los últimos 10 años las autoridades actúan en beneficio propio. Hay una ordenanza que obliga a usar lo recaudado en verano para mejorar el frente del río y hace 10 años que no ponen un peso.', 'directa'),
(603, 6, 3, 'La suciedad y la falta de infraestructura para disfrutar el río. La suciedad no se debe a los turistas sino a la falta de atención de la autoridad de turismo.', 'directa'),
(604, 6, 4, 'Los vecinos tienen que estar encima de las obras municipales para que se hagan bien. Había parrillas, asadores y baños y sacaron todo; los vecinos lograron que nivelaran asadores y mesas y habían hecho piletas para lavarse las manos, que también sacaron. Solo limpian cuando viene turismo; en la semana vienen una o dos empleadas municipales de 6 a 14 h. Critican que se cobre estacionamiento y asadores sin turismo ni servicios.', 'directa'),
(605, 6, 5, 'Se ocupan de algunos residuos, pero no pueden hacer más: para eso están los municipales y para eso cobran el impuesto.', 'directa'),
(606, 6, 6, 'En verano hay mucha gente; es un balneario muy familiar. Desde hace unos dos años el balneario viene en decadencia.', 'directa'),
(607, 6, 7, 'Este sector del río no está contaminado. Sí lo está donde el barrio El Dorado 2 tira agua residual al río (ya denunciado, sin respuesta) y en la zona del centro, que viene de Cosquín y La Falda, donde tiran residuos al río y se forman algas verdes.', 'directa'),
(608, 6, 8, 'Los vecinos no son tan unidos, así que los reclamos no cobran fuerza. En la municipalidad ya saben quiénes son.', 'directa'),
(609, 6, 9, 'Cobran estacionamiento muy caro ($7.000 la hora) y nadie se hace responsable si roban el auto. Pagan impuestos de categoría A pero no hay seguridad ni policía. Hace falta una reforma estructural; los gobernantes piensan en su bolsillo.', 'directa'),
(701, 7, 1, 'Residentes desde 2014.', 'directa'),
(702, 7, 2, 'El río tiene un potencial enorme que municipios y provincia no aprovechan. Hace tiempo hay manejo de fuego descontrolado: asados en el piso, consumo de alcohol. Sacaron los asadores de Playa de Oro y los trajeron acá; los vecinos alquilan chulengos y el lugar se llena de humo y basura que nadie recoge.', 'directa'),
(703, 7, 3, 'La suciedad: nadie recoge, y aunque las empleadas municipales a veces limpian a la mañana, todo está desbordado. En época de incendios el agua viene con ceniza. En temporada hay olores porque los pozos del barrio colapsan: no hay cloaca domiciliaria; los caños troncales pasan a 400/500 m y hay una planta sin inaugurar.', 'directa'),
(704, 7, 4, 'Las empleadas municipales limpian todas las mañanas y eso está bastante bien. Pero inspectoría y policía ven asados en el piso y no hacen nada; habría que multar ($200.000 por asado en el piso). El corte de pasto sí funciona cuando se reclama.', 'directa'),
(706, 7, 6, 'Sin castigo fuerte (multa, sanción) la gente no cambia; la educación no alcanza. Dejan la basura con el tacho a diez metros. Propone multas altas (ej. $50.000 por dejar basura).', 'directa'),
(708, 7, 8, 'Reclamó por alumbrado desde el 6 de junio sin respuesta; un poste caído estuvo 6 meses. Tras denunciar recibió un WhatsApp anónimo con amenazas. Denunció por WhatsApp 147 los líquidos cloacales de El Dorado 2: le dijeron que el río es de Carlos Paz; en inspectoría prometieron ir y el líquido sigue igual. Los vecinos se suman a reclamar pero ahí queda.', 'directa'),
(709, 7, 9, 'El río no se valora: debería ser el mayor patrimonio y, como el lago, tiene contaminación extrema. Con las obras troncales de cloacas de la provincia, los municipios iban a instalar la red domiciliaria, pero se avanzó y después se frenó.', 'directa'),
(801, 8, 1, 'Es de Carlos Paz, pero trabaja en San Antonio.', 'directa'),
(803, 8, 3, 'Muchos van a la farmacia por dolores de panza, descompostura o reacciones alérgicas atribuidas al agua. Por lo que le cuentan, el río está muy sucio y hubo robos en distintas zonas.', 'directa'),
(804, 8, 4, 'El Municipio, que debería encargarse de la limpieza del río, no hace nada.', 'directa'),
(805, 8, 5, 'Son los vecinos los que se organizan para mantener el río limpio y cuidado, hasta donde pueden.', 'directa'),
(806, 8, 6, 'En temporada \"facturan como locos\" por dolores de cabeza, panza, fiebre y descompostura; cree que el agua está contaminada. Cuando había asadores los turistas ensuciaban mucho, por eso los sacaron.', 'directa');

INSERT INTO respuesta_tema (id_respuesta, id_tema) VALUES
(103,2),(103,9),
(104,15),(104,22),
(105,16),
(106,8),(106,4),(106,24),
(107,11),(107,9),(107,8),(107,4),
(203,8),(203,2),(203,4),(203,5),(203,13),
(205,16),
(206,8),(206,24),
(207,6),(207,5),(207,3),(207,7),
(303,5),(303,1),(303,23),
(304,15),(304,16),(304,25),
(305,16),
(306,24),(306,9),(306,3),(306,25),(306,15),
(307,6),(307,5),
(309,22),
(401,12),
(405,15),
(410,17),(410,15),
(411,15),(411,24),
(414,11),(414,12),
(503,1),(503,10),
(504,17),(504,13),(504,10),(504,1),(504,15),
(505,16),
(506,3),(506,1),(506,24),
(508,18),(508,17),(508,10),
(602,20),
(603,2),(603,12),
(604,11),(604,12),(604,15),(604,21),(604,16),
(605,16),(605,15),
(606,24),
(607,1),(607,6),(607,7),(607,18),
(608,18),
(609,21),(609,25),
(702,9),(702,11),(702,3),
(703,2),(703,15),(703,9),(703,1),
(704,15),(704,19),(704,9),
(706,19),(706,3),(706,13),
(708,14),(708,18),(708,27),(708,1),(708,17),
(709,1),(709,7),
(803,26),(803,2),(803,25),
(804,15),
(805,16),
(806,26),(806,24),(806,3),(806,11);

INSERT INTO respuesta_lugar (id_respuesta, id_lugar) VALUES
(107,4),
(207,6),(207,3),(207,5),
(307,10),
(410,1),(410,3),(410,2),
(414,9),
(607,7),(607,11),
(702,8),
(708,7),(708,3),
(709,5);

INSERT INTO fuente (id_fuente, titulo, medio, tipo, fecha) VALUES
(1,  'San Antonio de Arredondo inicia la puesta en valor del Sendero del Río', 'Municipalidad de San Antonio de Arredondo', 'oficial_municipal', '2026-05-27'),
(2,  'Ariel Moyano inauguró las sesiones 2026 (plan Riberas de Arredondo)',     'Carlos Paz Vivo',                          'prensa',            '2026-03-02'),
(3,  'Presupuesto municipal 2026',                                             'Boletín Oficial',                          'normativa',         NULL),
(4,  'Balance municipal – Enero 2026',                                         'No especificado en el informe',            'oficial_municipal', NULL),
(5,  'Ordenanza 581/2026 – Plan de pavimentación y cordón cuneta',             'No especificado en el informe',                          'normativa',         NULL),
(6,  'Prioridad ambiental: avanzar con las cloacas',                           'Carlos Paz Noticias',                      'prensa',            '2026-06-10'),
(7,  'Visita de Llaryora a San Antonio y Mayu Sumaj',                          'Córdoba Interior Informa',                 'prensa',            '2026-07-15'),
(8,  'Primera sesión 2026 del Consejo de Planificación Urbana Ambiental',      'La Jornada',                               'prensa',            NULL),
(9,  'Monitoreo de los recursos hídricos',                                     'APRHI (Administración Provincial de Recursos Hídricos)', 'oficial_provincial', '2026-07-21'),
(10, 'Refuncionalización de baños y vestuarios del predio Los Algarrobos',     'Municipalidad de San Antonio de Arredondo', 'oficial_municipal', NULL),
(11, 'Tercer Punto Verde Municipal',                                           'La Jornada',                               'prensa',            '2025-05-21');

INSERT INTO hallazgo (id_hallazgo, id_salida, id_pregunta, id_fuente, id_lugar, tipo, titulo, descripcion, monto, fecha, estado) VALUES
(1,  3, 10, 2,    1,    'documental', 'Plan «Riberas de Arredondo»',
     'Presentado por el intendente Ariel Moyano en la apertura de sesiones 2026 para recuperar y poner en valor la zona del río. Figura entre los ejes ambientales de la gestión.', NULL, '2026-03-02', 'anunciado'),
(2,  3, 14, 1,    15,   'documental', 'Puesta en valor del Sendero del Río',
     'Recuperación del sendero que bordea el río: accesibilidad, unión y delimitación de tramos, materiales recuperados de podas, mejoras de circulación y seguridad. Parte del programa de sustentabilidad municipal.', NULL, '2026-05-27', 'en_ejecucion'),
(3,  3, 11, 3,    NULL, 'documental', 'Presupuesto general 2026',
     'Presupuesto municipal aprobado para el ejercicio 2026. No identifica cuánto se destina al río.', 9690000000.00, NULL, 'vigente'),
(4,  3, 11, 3,    NULL, 'documental', 'Fondos de afectación específica 2026',
     'Destinados a infraestructura, saneamiento, turismo, deporte y recreación social.', 385000000.00, NULL, 'vigente'),
(5,  3, 11, NULL, NULL, 'documental', 'Personal municipal destinado al río',
     'Vacío documental: no hay cifra verificable de trabajadores, presupuesto salarial ni horas destinadas al río.', NULL, NULL, 'sin_dato'),
(6,  3, 12, 8,    NULL, 'documental', 'Primera sesión 2026 del CAPUA',
     'Consejo de Planificación Urbana Ambiental: planificación urbana y ambiental, ordenamiento territorial, mapeo con el INTA, Código de Edificación, Proyecto Clara de Asís, comisión del Foro Urbano Ambiental y encuestas a vecinos.', NULL, NULL, 'realizado'),
(7,  3, 12, 5,    NULL, 'documental', 'Ordenanza 581/2026',
     'Citada en la matriz del informe; según la lista de fuentes es un plan de pavimentación y cordón cuneta, sin relación directa con el río.', NULL, NULL, 'sin_verificar'),
(8,  3, 13, 7,    2,    'documental', 'Compromiso provincial para red cloacal domiciliaria',
     'El gobernador Martín Llaryora anunció financiamiento para iniciar la red domiciliaria de cloacas de San Antonio de Arredondo. Es un compromiso anunciado, no una obra ejecutada.', 500000000.00, '2026-07-15', 'anunciado'),
(9,  3, 13, 9,    NULL, 'documental', 'Programa provincial de monitoreo de calidad del agua',
     'APRHI realiza campañas trimestrales y semestrales: análisis físicos, químicos y microbiológicos, temperatura, oxígeno disuelto, pH, conductividad, nutrientes, sales, microorganismos y caudales. No confirma campañas en el tramo del río San Antonio en 2026.', NULL, '2026-07-21', 'vigente'),
(10, 3, 14, 10,   13,   'documental', 'Refuncionalización de baños y vestuarios de Los Algarrobos',
     'Reequipamiento y ampliación de instalaciones sanitarias que habían sufrido vandalismo.', NULL, NULL, 'inaugurado'),
(11, 3, 14, 11,   14,   'documental', 'Puntos Verdes Municipales',
     'En 2025 había tres Puntos Verdes; uno sobre la costanera del río (Héroes de Malvinas y Ardiles) recibe reciclables y residuos especiales. Sin inventario 2026.', NULL, '2025-05-21', 'sin_verificar'),
(12, 2, 3,  NULL, 12,   'observacion_campo', 'Efluente cloacal en arroyo afluente',
     'Siguiendo la indicación de un vecino, entre un camping y un barrio privado se encontró una instalación de bombeo y agua de características cloacales que desemboca directamente en el río, con olores desagradables y renacuajos.', NULL, NULL, 'observado');

INSERT INTO hallazgo_tema (id_hallazgo, id_tema) VALUES
(1,22),(2,12),(2,22),(3,20),(4,20),(4,1),(5,15),(5,20),(6,22),(7,22),
(8,1),(9,23),(10,12),(11,2),(11,13),(12,1),(12,5);

INSERT INTO dato_pendiente (id_pregunta, id_hallazgo, descripcion) VALUES
(NULL, 1,    'Qué sectores del río comprende el plan'),
(NULL, 1,    'Qué intervenciones contempla y si incluye limpieza del cauce'),
(NULL, 1,    'Presupuesto asignado y organismo responsable'),
(10, NULL, 'Límites de intervención municipal y responsabilidades sobre el cauce'),
(NULL, 2,    'Ubicación exacta, extensión y obras previstas del Sendero'),
(NULL, 2,    'Presupuesto, responsables de mantenimiento y estado de ejecución'),
(NULL, 3,    'Apertura presupuestaria de Ambiente, Obras Públicas, Servicios Públicos y Turismo'),
(NULL, 5,    'Cantidad de trabajadores, presupuesto salarial y horas destinadas al río'),
(NULL, 6,    'Si el CAPUA interviene en decisiones sobre el río y si hay organizaciones ambientales representadas'),
(NULL, 6,    'Si se elaboran diagnósticos sobre márgenes y calidad del agua'),
(12, NULL, 'Nuevas ordenanzas ambientales y controles específicos sobre el río'),
(12, NULL, 'Ordenanza que destina lo recaudado en verano al frente del río (no figura en el relevamiento, la menciona E6)'),
(NULL, 8,    'Barrios alcanzados, domicilios conectables y metros de red'),
(NULL, 8,    'Organismo ejecutor, cronograma y % actual de cobertura cloacal'),
(NULL, 9,    'Resultados de los últimos monitoreos de la cuenca y calendario de muestreo'),
(13, NULL, 'Convenios vigentes y funcionamiento del ente regional'),
(NULL, 10,   'Si el predio Los Algarrobos se vincula con la gestión del río'),
(NULL, 11,   'Si los tres Puntos Verdes siguen funcionando en 2026'),
(14, NULL, 'Inventario de balnearios, sanitarios, asadores, cloacas y estado de conservación'),
(NULL, 12,   'Si los efluentes provienen del camping o del barrio privado');

-- ---------------------------------------------------------------------
-- 3. VISTAS PARA EL ANÁLISIS
-- ---------------------------------------------------------------------

CREATE VIEW v_matriz_vecinos AS
SELECT e.codigo, e.perfil, s.numero AS salida,
       MAX(CASE WHEN p.codigo='P1' THEN r.texto END) AS P1_residencia,
       MAX(CASE WHEN p.codigo='P2' THEN r.texto END) AS P2_cambios,
       MAX(CASE WHEN p.codigo='P3' THEN r.texto END) AS P3_problemas,
       MAX(CASE WHEN p.codigo='P4' THEN r.texto END) AS P4_quien_se_ocupa,
       MAX(CASE WHEN p.codigo='P5' THEN r.texto END) AS P5_vecinos_organizados,
       MAX(CASE WHEN p.codigo='P6' THEN r.texto END) AS P6_verano_invierno,
       MAX(CASE WHEN p.codigo='P7' THEN r.texto END) AS P7_causas,
       MAX(CASE WHEN p.codigo='P8' THEN r.texto END) AS P8_reclamos,
       MAX(CASE WHEN p.codigo='P9' THEN r.texto END) AS P9_otros
FROM entrevistado e
JOIN salida_campo s ON s.id_salida = e.id_salida
LEFT JOIN respuesta r ON r.id_entrevistado = e.id_entrevistado
LEFT JOIN pregunta  p ON p.id_pregunta = r.id_pregunta
GROUP BY e.id_entrevistado, e.codigo, e.perfil, s.numero
ORDER BY e.codigo;

CREATE VIEW v_menciones_por_tema AS
SELECT t.categoria, t.nombre AS tema,
       COUNT(DISTINCT r.id_entrevistado) AS entrevistados,
       COUNT(DISTINCT ht.id_hallazgo)    AS hallazgos
FROM tema t
LEFT JOIN respuesta_tema rt ON rt.id_tema = t.id_tema
LEFT JOIN respuesta r       ON r.id_respuesta = rt.id_respuesta
LEFT JOIN hallazgo_tema ht  ON ht.id_tema = t.id_tema
GROUP BY t.id_tema, t.categoria, t.nombre;

CREATE VIEW v_evidencia_por_pregunta AS
SELECT p.codigo, p.texto AS pregunta, 'entrevista' AS tipo,
       e.codigo AS origen, r.texto AS contenido
FROM respuesta r
JOIN pregunta p     ON p.id_pregunta = r.id_pregunta
JOIN entrevistado e ON e.id_entrevistado = r.id_entrevistado
UNION ALL
SELECT p.codigo, p.texto, h.tipo,
       CASE WHEN h.tipo = 'observacion_campo' THEN 'Observación propia (Salida 2)'
            ELSE COALESCE(f.medio, 'Sin fuente (vacío documental)') END,
       CONCAT(h.titulo, ': ', h.descripcion)
FROM hallazgo h
JOIN pregunta p    ON p.id_pregunta = h.id_pregunta
LEFT JOIN fuente f ON f.id_fuente = h.id_fuente;

CREATE VIEW v_pendientes AS
SELECT p.codigo, h.titulo AS hallazgo, d.descripcion AS pendiente
FROM dato_pendiente d
LEFT JOIN hallazgo h ON h.id_hallazgo = d.id_hallazgo
JOIN pregunta p ON p.id_pregunta = COALESCE(d.id_pregunta, h.id_pregunta)
ORDER BY p.codigo;
