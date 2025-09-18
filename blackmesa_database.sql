-- =============================================
-- BASE DE DATOS BLACKMESA - DIRECTORIO DE RESTAURANTES
-- =============================================

CREATE DATABASE blackmesa_directorio;
USE blackmesa_directorio;
DB_HOST = localhost DB_NAME = blackmesa_directorio DB_USER = BlackMesa DB_PASSWORD = contraseña_segura EMAILJS_SERVICE_ID = service_3j8wzwy EMAILJS_TEMPLATE_ID = plantilla_e2p7kqe EMAILJS_PUBLIC_KEY = wt8oRv0cC4xanrs4P
-- =============================================
-- TABLA DE USUARIOS
-- =============================================
CREATE TABLE usuarios (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo_usuario ENUM('invitado', 'comensal', 'propietario', 'administrador') NOT NULL DEFAULT 'invitado',
    estado ENUM('activo', 'inactivo', 'pendiente') NOT NULL DEFAULT 'activo',
    permisos_admin VARCHAR(50) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    timestamp_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_tipo_usuario (tipo_usuario)
);

-- =============================================
-- TABLA DE CÓDIGOS DE VERIFICACIÓN
-- =============================================
CREATE TABLE codigos_verificacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(6) UNIQUE NOT NULL,
    tipo ENUM('owner', 'admin') NOT NULL,
    descripcion VARCHAR(255),
    estado ENUM('active', 'used', 'expired') NOT NULL DEFAULT 'active',
    usuario_id VARCHAR(50) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_uso TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_codigo (codigo),
    INDEX idx_tipo_estado (tipo, estado)
);

-- =============================================
-- TABLA DE RESTAURANTES
-- =============================================
CREATE TABLE restaurantes (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria ENUM('Comida Tradicional', 'Comida Rápida', 'Gourmet', 'Parrilla', 'Mariscos', 'Cafetería', 'Postres', 'Vegetariano', 'Pizza', 'Comida Internacional') NOT NULL,
    descripcion TEXT NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(500) NOT NULL,
    imagen_url TEXT,
    propietario_id VARCHAR(50) NOT NULL,
    rif_licencia VARCHAR(100),
    estado ENUM('activo', 'inactivo', 'pendiente') NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (propietario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_categoria (categoria),
    INDEX idx_propietario (propietario_id),
    INDEX idx_estado (estado),
    FULLTEXT idx_busqueda (nombre, descripcion)
);

-- =============================================
-- TABLA DE RESERVAS
-- =============================================
CREATE TABLE reservas (
    id VARCHAR(50) PRIMARY KEY,
    restaurante_id VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(50) NOT NULL,
    nombre_cliente VARCHAR(255) NOT NULL,
    telefono_cliente VARCHAR(20) NOT NULL,
    email_cliente VARCHAR(255),
    fecha_reserva DATE NOT NULL,
    hora_reserva TIME NOT NULL,
    numero_personas INT NOT NULL,
    peticiones_especiales TEXT,
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') NOT NULL DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_restaurante_fecha (restaurante_id, fecha_reserva),
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado)
);

-- =============================================
-- TABLA DE VISITAS A RESTAURANTES
-- =============================================
CREATE TABLE visitas_restaurante (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurante_id VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_visita TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_restaurante (restaurante_id),
    INDEX idx_fecha (fecha_visita),
    INDEX idx_usuario (usuario_id)
);

-- =============================================
-- TABLA DE SOLICITUDES DE REGISTRO
-- =============================================
CREATE TABLE solicitudes_registro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_solicitud ENUM('propietario', 'administrador') NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    nombre_restaurante VARCHAR(255),
    direccion_restaurante VARCHAR(500),
    rif_licencia VARCHAR(100),
    razon_solicitud TEXT,
    experiencia TEXT,
    motivacion TEXT,
    referencias TEXT,
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    codigo_asignado VARCHAR(6),
    usuario_procesador VARCHAR(50),
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesamiento TIMESTAMP NULL,
    notas_procesamiento TEXT,
    FOREIGN KEY (usuario_procesador) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_tipo_estado (tipo_solicitud, estado),
    INDEX idx_email (email),
    INDEX idx_fecha (fecha_solicitud)
);

-- =============================================
-- TABLA DE ARCHIVOS ADJUNTOS
-- =============================================
CREATE TABLE archivos_solicitud (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(100),
    tamaño_bytes INT,
    ruta_archivo VARCHAR(500),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_registro(id) ON DELETE CASCADE,
    INDEX idx_solicitud (solicitud_id)
);

-- =============================================
-- TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =============================================
CREATE TABLE configuracion_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion VARCHAR(255),
    tipo_dato ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA DE LOGS DEL SISTEMA
-- =============================================
CREATE TABLE logs_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id VARCHAR(50),
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id VARCHAR(50),
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario_fecha (usuario_id, fecha_log),
    INDEX idx_accion (accion),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_fecha (fecha_log)
);

-- =============================================
-- TABLA DE SESIONES DE USUARIO
-- =============================================
CREATE TABLE sesiones_usuario (
    id VARCHAR(128) PRIMARY KEY,
    usuario_id VARCHAR(50) NOT NULL,
    datos_sesion JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_expiracion (fecha_expiracion),
    INDEX idx_activa (activa)
);

-- =============================================
-- INSERCIÓN DE DATOS INICIALES
-- =============================================

-- Configuraciones del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo_dato) VALUES
('limite_restaurantes_propietario', '5', 'Número máximo de restaurantes por propietario', 'number'),
('email_desarrolladores', 'leftmesa@gmail.com', 'Email de contacto de los desarrolladores', 'string'),
('emailjs_service_id', 'service_3j8wzwy', 'ID del servicio EmailJS', 'string'),
('emailjs_template_id', 'plantilla_e2p7kqe', 'ID del template EmailJS', 'string'),
('emailjs_public_key', 'wt8oRv0cC4xanrs4P', 'Clave pública de EmailJS', 'string'),
('version_sistema', '1.0.0', 'Versión actual del sistema', 'string');

-- =============================================
-- DATOS INICIALES (OPCIONAL - ELIMINAR EN PRODUCCIÓN)
-- =============================================

-- IMPORTANTE: Cambiar estas credenciales en producción
-- Usuario administrador por defecto (CAMBIAR PASSWORD)
INSERT INTO usuarios (id, email, password_hash, nombre, telefono, tipo_usuario, estado) VALUES
('admin_default', 'admin@blackmesa.com', 'CAMBIAR_PASSWORD_HASH', 'Administrador Sistema', '+58412-0000000', 'administrador', 'activo');

-- DATOS DE EJEMPLO (ELIMINAR EN PRODUCCIÓN SI NO SE NECESITAN)
INSERT INTO usuarios (id, email, password_hash, nombre, telefono, tipo_usuario, estado) VALUES
('owner_sample_1', 'owner1@example.com', 'CAMBIAR_PASSWORD_HASH1', 'Propietario Ejemplo 1', '+58412-1111111', 'propietario', 'activo'),
('owner_sample_2', 'owner2@example.com', 'CAMBIAR_PASSWORD_HASH2', 'Propietario Ejemplo 2', '+58424-2222222', 'propietario', 'activo');

INSERT INTO restaurantes (id, nombre, categoria, descripcion, telefono, direccion, propietario_id) VALUES
('sample_1', 'Mariscos El Puerto', 'Mariscos', 'Los mejores mariscos frescos del puerto, preparados con recetas tradicionales.', '+58412-1234567', 'Av. Libertador, Puerto La Cruz', 'owner_sample_1'),
('sample_2', 'Parrilla Don Pedro', 'Parrilla', 'Carnes premium a la parrilla con el mejor sabor tradicional venezolano.', '+58424-7654321', 'Centro Comercial Plaza Mayor', 'owner_sample_2'),
('sample_3', 'Café Central', 'Cafetería', 'Un espacio acogedor para disfrutar del mejor café y repostería artesanal.', '+58416-9876543', 'Plaza Bolívar, Centro', 'owner_sample_1');

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de estadísticas de restaurantes
CREATE VIEW vista_estadisticas_restaurantes AS
SELECT 
    r.id,
    r.nombre,
    r.categoria,
    u.nombre AS propietario,
    COUNT(DISTINCT res.id) AS total_reservas,
    COUNT(DISTINCT v.id) AS total_visitas,
    r.fecha_creacion
FROM restaurantes r
LEFT JOIN usuarios u ON r.propietario_id = u.id
LEFT JOIN reservas res ON r.id = res.restaurante_id
LEFT JOIN visitas_restaurante v ON r.id = v.restaurante_id
WHERE r.estado = 'activo'
GROUP BY r.id;

-- Vista de reservas pendientes
CREATE VIEW vista_reservas_pendientes AS
SELECT 
    res.id,
    res.nombre_cliente,
    res.telefono_cliente,
    res.fecha_reserva,
    res.hora_reserva,
    res.numero_personas,
    r.nombre AS restaurante,
    u.nombre AS propietario,
    res.fecha_creacion
FROM reservas res
JOIN restaurantes r ON res.restaurante_id = r.id
JOIN usuarios u ON r.propietario_id = u.id
WHERE res.estado = 'pendiente'
ORDER BY res.fecha_reserva ASC, res.hora_reserva ASC;

-- Vista de códigos activos
CREATE VIEW vista_codigos_activos AS
SELECT 
    codigo,
    tipo,
    descripcion,
    fecha_creacion,
    DATEDIFF(CURRENT_DATE, DATE(fecha_creacion)) AS dias_desde_creacion
FROM codigos_verificacion 
WHERE estado = 'active'
ORDER BY fecha_creacion DESC;

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS
-- =============================================

DELIMITER //

-- Procedimiento para registrar visita a restaurante
CREATE PROCEDURE RegistrarVisita(
    IN p_restaurante_id VARCHAR(50),
    IN p_usuario_id VARCHAR(50),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    INSERT INTO visitas_restaurante (restaurante_id, usuario_id, ip_address, user_agent)
    VALUES (p_restaurante_id, p_usuario_id, p_ip_address, p_user_agent);
END //

-- Procedimiento para obtener estadísticas de un propietario
CREATE PROCEDURE ObtenerEstadisticasPropietario(
    IN p_propietario_id VARCHAR(50)
)
BEGIN
    SELECT 
        COUNT(r.id) AS total_restaurantes,
        COUNT(DISTINCT res.id) AS total_reservas,
        COUNT(DISTINCT v.id) AS total_visitas,
        AVG(sub.visitas_por_restaurante) AS promedio_visitas_restaurante
    FROM restaurantes r
    LEFT JOIN reservas res ON r.id = res.restaurante_id
    LEFT JOIN visitas_restaurante v ON r.id = v.restaurante_id
    LEFT JOIN (
        SELECT restaurante_id, COUNT(*) AS visitas_por_restaurante
        FROM visitas_restaurante
        GROUP BY restaurante_id
    ) sub ON r.id = sub.restaurante_id
    WHERE r.propietario_id = p_propietario_id AND r.estado = 'activo';
END //

DELIMITER ;

-- =============================================
-- TRIGGERS
-- =============================================

DELIMITER //

-- Trigger para logging de cambios en restaurantes
CREATE TRIGGER log_restaurante_changes
AFTER UPDATE ON restaurantes
FOR EACH ROW
BEGIN
    INSERT INTO logs_sistema (
        accion, 
        tabla_afectada, 
        registro_id, 
        datos_anteriores, 
        datos_nuevos
    ) VALUES (
        'UPDATE',
        'restaurantes',
        NEW.id,
        JSON_OBJECT(
            'nombre', OLD.nombre,
            'categoria', OLD.categoria,
            'descripcion', OLD.descripcion,
            'telefono', OLD.telefono,
            'direccion', OLD.direccion,
            'estado', OLD.estado
        ),
        JSON_OBJECT(
            'nombre', NEW.nombre,
            'categoria', NEW.categoria,
            'descripcion', NEW.descripcion,
            'telefono', NEW.telefono,
            'direccion', NEW.direccion,
            'estado', NEW.estado
        )
    );
END //

-- Trigger para validar límite de restaurantes por propietario
CREATE TRIGGER validar_limite_restaurantes
BEFORE INSERT ON restaurantes
FOR EACH ROW
BEGIN
    DECLARE limite INT DEFAULT 5;
    DECLARE contador INT;
    
    -- Obtener el límite desde configuración
    SELECT CAST(valor AS UNSIGNED) INTO limite 
    FROM configuracion_sistema 
    WHERE clave = 'limite_restaurantes_propietario';
    
    -- Contar restaurantes activos del propietario
    SELECT COUNT(*) INTO contador
    FROM restaurantes 
    WHERE propietario_id = NEW.propietario_id 
    AND estado = 'activo';
    
    -- Verificar si el usuario es administrador
    IF (SELECT tipo_usuario FROM usuarios WHERE id = NEW.propietario_id) != 'administrador' 
    AND contador >= limite THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El propietario ha alcanzado el límite máximo de restaurantes';
    END IF;
END //

DELIMITER ;

-- =============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =============================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_reservas_restaurante_fecha ON reservas (restaurante_id, fecha_reserva, estado);
CREATE INDEX idx_visitas_fecha_restaurante ON visitas_restaurante (fecha_visita, restaurante_id);
CREATE INDEX idx_usuarios_tipo_estado ON usuarios (tipo_usuario, estado);
CREATE INDEX idx_restaurantes_propietario_categoria ON restaurantes (propietario_id, categoria, estado);

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

ALTER TABLE usuarios COMMENT = 'Tabla principal de usuarios del sistema con diferentes roles';
ALTER TABLE restaurantes COMMENT = 'Información de los restaurantes registrados en el directorio';
ALTER TABLE reservas COMMENT = 'Reservas realizadas por los usuarios en los restaurantes';
ALTER TABLE codigos_verificacion COMMENT = 'Códigos de verificación para registro de propietarios y administradores';
ALTER TABLE solicitudes_registro COMMENT = 'Solicitudes de registro pendientes de aprobación';
ALTER TABLE visitas_restaurante COMMENT = 'Log de visitas a las páginas de restaurantes';
ALTER TABLE logs_sistema COMMENT = 'Registro de actividades y cambios en el sistema';
ALTER TABLE configuracion_sistema COMMENT = 'Configuraciones globales del sistema';

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
