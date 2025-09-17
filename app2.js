// Sistema de Login - Directorio de Restaurantes
// Variables globales
let currentTab = 'login';
let currentRole = '';

// Configuración de email para desarrolladores
const DEVELOPERS_EMAIL = 'leftmesa@gmail.com';

// ===== CONFIGURACIÓN EMAILJS CORREGIDA =====
const EMAILJS_CONFIG = {
    serviceID: 'service_3j8wzwy',
    templateID: 'plantilla_e2p7kqe',
    publicKey: 'wt8oRv0cC4xanrs4P'
};

// ===== SISTEMA DE VALIDACIÓN DE CÓDIGOS =====
let ownerCodes = [];
let adminCodes = [];

// Cargar códigos desde el gestor
function loadVerificationCodes() {
    try {
        ownerCodes = JSON.parse(localStorage.getItem('blackmesa_owner_codes') || '[]');
        adminCodes = JSON.parse(localStorage.getItem('blackmesa_admin_codes') || '[]');
        console.log('📋 Códigos cargados:', {
            owner: ownerCodes.length,
            admin: adminCodes.length
        });
    } catch (error) {
        console.error('❌ Error cargando códigos:', error);
        ownerCodes = [];
        adminCodes = [];
    }
}

// Validar código de propietario
function validateOwnerCode(code) {
    loadVerificationCodes(); // Recargar códigos cada vez
    const codeObj = ownerCodes.find(c => c.code === code && c.status === 'active');
    console.log(`🔍 Validando código propietario ${code}:`, !!codeObj);
    return !!codeObj;
}

// Validar código de administrador
function validateAdminCode(code) {
    loadVerificationCodes(); // Recargar códigos cada vez
    const codeObj = adminCodes.find(c => c.code === code && c.status === 'active');
    console.log(`🔍 Validando código admin ${code}:`, !!codeObj);
    return !!codeObj;
}

// Marcar código como usado
function markCodeAsUsed(code, type) {
    loadVerificationCodes();
    
    if (type === 'owner') {
        const codeObj = ownerCodes.find(c => c.code === code && c.status === 'active');
        if (codeObj) {
            codeObj.status = 'used';
            codeObj.used = new Date().toISOString();
            localStorage.setItem('blackmesa_owner_codes', JSON.stringify(ownerCodes));
            console.log(`✅ Código propietario ${code} marcado como usado`);
            return true;
        }
    } else if (type === 'admin') {
        const codeObj = adminCodes.find(c => c.code === code && c.status === 'active');
        if (codeObj) {
            codeObj.status = 'used';
            codeObj.used = new Date().toISOString();
            localStorage.setItem('blackmesa_admin_codes', JSON.stringify(adminCodes));
            console.log(`✅ Código admin ${code} marcado como usado`);
            return true;
        }
    }
    
    console.log(`❌ No se pudo marcar código ${code} como usado`);
    return false;
}

// Cargar EmailJS dinámicamente - MEJORADO
function loadEmailJS() {
    return new Promise((resolve, reject) => {
        if (window.emailjs) {
            console.log('EmailJS ya está cargado');
            resolve();
            return;
        }
        
        console.log('Cargando EmailJS...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = () => {
            try {
                if (window.emailjs) {
                    emailjs.init(EMAILJS_CONFIG.publicKey);
                    console.log('✅ EmailJS cargado y inicializado correctamente');
                    resolve();
                } else {
                    throw new Error('EmailJS no se cargó correctamente');
                }
            } catch (error) {
                console.error('❌ Error inicializando EmailJS:', error);
                reject(error);
            }
        };
        script.onerror = (error) => {
            console.error('❌ Error cargando EmailJS desde CDN:', error);
            reject(new Error('Error cargando EmailJS desde CDN'));
        };
        document.head.appendChild(script);
    });
}

// Función mejorada para enviar email usando EmailJS
async function sendEmailViaEmailJS(formData) {
    try {
        console.log('🚀 Iniciando envío via EmailJS...');
        
        // Cargar EmailJS si no está cargado
        await loadEmailJS();
        
        // Verificar que EmailJS esté disponible
        if (!window.emailjs) {
            throw new Error('EmailJS no está disponible después de la carga');
        }
        
        const templateParams = {
            to_email: DEVELOPERS_EMAIL,
            from_name: formData.name,
            from_email: formData.email,
            message: generateMessageBody(formData),
            user_type: formData.type,
            timestamp: new Date().toLocaleString('es-ES'),
            phone: formData.phone || 'No especificado',
            restaurant_name: formData.restaurantName || '',
            restaurant_address: formData.restaurantAddress || '',
            business_license: formData.businessLicense || '',
            request_reason: formData.reason || '',
            admin_experience: formData.experience || '',
            admin_motivation: formData.motivation || '',
            admin_references: formData.references || '',
            has_restaurant: formData.type === 'propietario' ? 'true' : '',
            has_admin_info: formData.type === 'administrador' ? 'true' : '',
            files_count: formData.files ? formData.files.length : 0
        };
        
        templateParams.additional_info = formData.additional_info || '';
        templateParams.user_id = formData.user_id || '';
        templateParams.session_id = formData.session_id || '';        
        
        console.log('📋 Parámetros completos del template:', templateParams);
        
        // Enviar el email con todos los parámetros
        console.log('📤 Enviando email con variables completas...');
        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceID,
            EMAILJS_CONFIG.templateID,
            templateParams
        );
        
        console.log('✅ Email enviado exitosamente:', response);
        return { 
            success: true, 
            message: 'Email enviado correctamente', 
            response: response 
        };
        
    } catch (error) {
        console.error('❌ Error detallado enviando email:', error);
        
        if (error.status) {
            console.error('Status HTTP:', error.status);
        }
        if (error.text) {
            console.error('Mensaje de error:', error.text);
        }
        
        throw error;
    }
}

// Generar cuerpo del mensaje
function generateMessageBody(formData) {
    let body = `NUEVA SOLICITUD DE ${formData.type.toUpperCase()}\n`;
    body += `Directorio de Restaurantes BlackMesa\n\n`;
    body += `INFORMACIÓN DEL SOLICITANTE\n`;
    body += `=============================\n`;
    body += `Fecha: ${new Date().toLocaleString('es-ES')}\n`;
    body += `Nombre: ${formData.name}\n`;
    body += `Email: ${formData.email}\n`;
    body += `Teléfono: ${formData.phone}\n\n`;
    
    if (formData.type === 'propietario') {
        body += `INFORMACIÓN DEL RESTAURANTE\n`;
        body += `===========================\n`;
        body += `Restaurante: ${formData.restaurantName}\n`;
        body += `Dirección: ${formData.restaurantAddress}\n`;
        body += `RIF/Licencia: ${formData.businessLicense}\n`;
        body += `Razón: ${formData.reason}\n\n`;
    }
    
    if (formData.type === 'administrador') {
        body += `INFORMACIÓN PROFESIONAL\n`;
        body += `=======================\n`;
        body += `Experiencia: ${formData.experience}\n`;
        body += `Motivación: ${formData.motivation}\n`;
        if (formData.references) {
            body += `Referencias: ${formData.references}\n`;
        }
        body += `\n`;
    }
    
    if (formData.files && formData.files.length > 0) {
        body += `ARCHIVOS ADJUNTOS\n`;
        body += `=================\n`;
        body += `${formData.files.length} archivo(s):\n`;
        for (let i = 0; i < formData.files.length; i++) {
            body += `- ${formData.files[i].name} (${(formData.files[i].size/1024).toFixed(1)}KB)\n`;
        }
    }
    
    return body;
}

// Función fallback usando mailto
function sendEmailViaMailto(formData) {
    const subject = encodeURIComponent(`Nueva Solicitud ${formData.type} - Directorio BlackMesa`);
    const body = encodeURIComponent(generateMessageBody(formData));
    const mailtoLink = `mailto:${DEVELOPERS_EMAIL}?subject=${subject}&body=${body}`;
    
    console.log('📧 Abriendo cliente de email como fallback');
    window.open(mailtoLink);
    return Promise.resolve({ success: true, message: 'Cliente de email abierto' });
}

// Función principal para enviar solicitud
async function sendRequestToDevs(formData) {
    console.log('📄 Iniciando proceso de envío de solicitud...');
    
    try {
        console.log('📨 Intentando enviar via EmailJS...');
        const result = await sendEmailViaEmailJS(formData);
        console.log('✅ EmailJS exitoso:', result);
        return result;
    } catch (error) {
        console.error('❌ EmailJS falló, usando fallback:', error);
        
        if (error.status === 400) {
            console.error('Error 400: Verificar configuración del template o parámetros');
        } else if (error.status === 401) {
            console.error('Error 401: Verificar Public Key de EmailJS');
        } else if (error.status === 404) {
            console.error('Error 404: Verificar Service ID o Template ID');
        }
        
        throw error;
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Aplicación iniciada');
    setupEventListeners();
    loadVerificationCodes();
    // Mostrar la selección de rol para login por defecto
    document.getElementById('loginRoleSelection').classList.add('active');
});

// Configurar event listeners
function setupEventListeners() {
    // Event listeners para formularios
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerComensalForm').addEventListener('submit', handleRegisterComensal);
    document.getElementById('requestPropietarioForm').addEventListener('submit', handleRequestPropietario);
    document.getElementById('requestAdminForm').addEventListener('submit', handleRequestAdmin);
    
    // Event listeners para archivos
    document.getElementById('propietarioFiles').addEventListener('change', handleFileSelect);
    document.getElementById('adminFiles').addEventListener('change', handleFileSelect);
    
    // Event listeners para validación de códigos en tiempo real
    document.getElementById('propietarioVerificationCode').addEventListener('input', validatePropietarioCode);
    document.getElementById('adminVerificationCode').addEventListener('input', validateAdminCode);
}

// Validación de código de propietario en tiempo real
function validatePropietarioCode() {
    const code = document.getElementById('propietarioVerificationCode').value.trim();
    const status = document.getElementById('propietarioCodeStatus');
    const additionalFields = document.getElementById('propietarioAdditionalFields');
    const submitBtn = document.getElementById('propietarioSubmitBtn');
    
    if (code.length !== 6) {
        status.innerHTML = '';
        additionalFields.style.display = 'none';
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud a los Desarrolladores';
        return;
    }
    
    if (validateOwnerCode(code)) {
        status.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i> <span style="color: #28a745;">Código válido - Proceder con registro</span>';
        additionalFields.style.display = 'block';
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Completar Registro de Propietario';
        
        // Hacer campos de contraseña requeridos
        document.getElementById('propietarioPassword').required = true;
        document.getElementById('propietarioConfirmPassword').required = true;
    } else {
        status.innerHTML = '<i class="fas fa-times-circle" style="color: #dc3545;"></i> <span style="color: #dc3545;">Código inválido o ya usado</span>';
        additionalFields.style.display = 'none';
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud a los Desarrolladores';
        
        // Remover requerimiento de contraseñas
        document.getElementById('propietarioPassword').required = false;
        document.getElementById('propietarioConfirmPassword').required = false;
    }
}

// Validación de código de administrador en tiempo real
function validateAdminCodeInput() {
    const code = document.getElementById('adminVerificationCode').value.trim();
    const status = document.getElementById('adminCodeStatus');
    const additionalFields = document.getElementById('adminAdditionalFields');
    const submitBtn = document.getElementById('adminSubmitBtn');
    
    if (code.length !== 6) {
        status.innerHTML = '';
        additionalFields.style.display = 'none';
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud a los Desarrolladores';
        return;
    }
    
    if (validateAdminCode(code)) {
        status.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i> <span style="color: #28a745;">Código válido - Proceder con registro</span>';
        additionalFields.style.display = 'block';
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Completar Registro de Administrador';
        
        // Hacer campos requeridos
        document.getElementById('adminPassword').required = true;
        document.getElementById('adminConfirmPassword').required = true;
        document.getElementById('adminPermissions').required = true;
    } else {
        status.innerHTML = '<i class="fas fa-times-circle" style="color: #dc3545;"></i> <span style="color: #dc3545;">Código inválido o ya usado</span>';
        additionalFields.style.display = 'none';
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud a los Desarrolladores';
        
        // Remover requerimientos
        document.getElementById('adminPassword').required = false;
        document.getElementById('adminConfirmPassword').required = false;
        document.getElementById('adminPermissions').required = false;
    }
}

// Cambiar entre pestañas principales
function switchTab(tab) {
    currentTab = tab;
    
    // Actualizar pestañas
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    // Ocultar todos los formularios y selecciones
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.role-selection').forEach(r => r.classList.remove('active'));
    
    // Mostrar la selección de rol correspondiente
    if (tab === 'login') {
        document.getElementById('loginRoleSelection').classList.add('active');
    } else if (tab === 'register') {
        document.getElementById('registerRoleSelection').classList.add('active');
    }
    
    // Limpiar selecciones previas
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
    currentRole = '';
    
    clearMessages();
}

// Seleccionar rol para login
function selectLoginRole(role) {
    currentRole = role;
    
    // Actualizar botones de rol
    document.querySelectorAll('#loginRoleSelection .role-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Ocultar selección de rol y mostrar formulario de login
    document.getElementById('loginRoleSelection').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('loginUserType').value = role;
}

// Seleccionar rol para registro
function selectRegisterRole(role) {
    currentRole = role;
    
    // Actualizar botones de rol
    document.querySelectorAll('#registerRoleSelection .role-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Ocultar selección de rol y mostrar formulario correspondiente
    document.getElementById('registerRoleSelection').classList.remove('active');
    
    switch(role) {
        case 'comensal':
            document.getElementById('registerComensalForm').classList.add('active');
            break;
        case 'propietario':
            document.getElementById('requestPropietarioForm').classList.add('active');
            break;
        case 'administrador':
            document.getElementById('requestAdminForm').classList.add('active');
            break;
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Mostrar/ocultar loading
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.querySelectorAll('.auth-button').forEach(btn => btn.disabled = true);
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.querySelectorAll('.auth-button').forEach(btn => btn.disabled = false);
}

// Mostrar mensajes
function showError(message) {
    console.log('❌ Error mostrado:', message);
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + message;
    errorDiv.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('infoMessage').style.display = 'none';
}

function showSuccess(message) {
    console.log('✅ Éxito mostrado:', message);
    const successDiv = document.getElementById('successMessage');
    successDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
    successDiv.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('infoMessage').style.display = 'none';
}

function showInfo(message) {
    console.log('ℹ️ Info mostrada:', message);
    const infoDiv = document.getElementById('infoMessage');
    infoDiv.innerHTML = '<i class="fas fa-info-circle"></i> ' + message;
    infoDiv.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

function clearMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('infoMessage').style.display = 'none';
}

// Validación de email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validación de teléfono venezolano
function validateVenezuelanPhone(phone) {
    const re = /^(\+58|58|0)?(4\d{9}|2\d{9})$/;
    return re.test(phone.replace(/\s|-/g, ''));
}

// Manejar inicio de sesión
async function handleLogin(e) {
    e.preventDefault();
    clearMessages();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const userType = document.getElementById('loginUserType').value;
    
    // Validaciones básicas
    if (!validateEmail(email)) {
        showError('Por favor ingresa un email válido');
        return;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (!userType) {
        showError('Por favor selecciona tu tipo de usuario');
        return;
    }
    
    showLoading();
    
    try {
        // Simular llamada a API de login
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showSuccess(`¡Inicio de sesión exitoso como ${userType}! Redirigiendo...`);
        
        // Guardar datos de usuario
        localStorage.setItem('userType', userType);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('loginTimestamp', new Date().toISOString());
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = 'directorio.html';
        }, 2000);
        
    } catch (error) {
        showError('Error de conexión. Por favor intenta de nuevo.');
        console.error('Login error:', error);
    } finally {
        hideLoading();
    }
}

// Manejar registro de comensal
async function handleRegisterComensal(e) {
    e.preventDefault();
    clearMessages();
    
    const name = document.getElementById('comensalName').value;
    const email = document.getElementById('comensalEmail').value;
    const phone = document.getElementById('comensalPhone').value;
    const password = document.getElementById('comensalPassword').value;
    const confirmPassword = document.getElementById('comensalConfirmPassword').value;
    
    // Validaciones
    if (name.length < 2) {
        showError('El nombre debe tener al menos 2 caracteres');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Por favor ingresa un email válido');
        return;
    }
    
    if (!validateVenezuelanPhone(phone)) {
        showError('Por favor ingresa un número de teléfono venezolano válido');
        return;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }
    
    showLoading();
    
    try {
        // Simular llamada a API de registro
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showSuccess('¡Cuenta de comensal creada exitosamente! Redirigiendo al directorio...');
        
        // Guardar datos de usuario
        localStorage.setItem('userType', 'comensal');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name);
        localStorage.setItem('loginTimestamp', new Date().toISOString());
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = 'directorio.html';
        }, 2000);
        
    } catch (error) {
        showError('Error de conexión. Por favor intenta de nuevo.');
        console.error('Register error:', error);
    } finally {
        hideLoading();
    }
}

// Manejar solicitud/registro de propietario
async function handleRequestPropietario(e) {
    e.preventDefault();
    clearMessages();
    
    const code = document.getElementById('propietarioVerificationCode').value.trim();
    const name = document.getElementById('propietarioName').value;
    const email = document.getElementById('propietarioEmail').value;
    const phone = document.getElementById('propietarioPhone').value;
    const restaurantName = document.getElementById('restaurantName').value;
    const restaurantAddress = document.getElementById('restaurantAddress').value;
    const businessLicense = document.getElementById('businessLicense').value;
    const reason = document.getElementById('requestReason').value;
    const files = document.getElementById('propietarioFiles').files;
    
    // Verificar si es registro directo o solicitud
    const isDirectRegistration = validateOwnerCode(code);
    
    if (isDirectRegistration) {
        // REGISTRO DIRECTO CON CÓDIGO VÁLIDO
        const password = document.getElementById('propietarioPassword').value;
        const confirmPassword = document.getElementById('propietarioConfirmPassword').value;
        
        // Validaciones para registro directo
        if (!validateEmail(email)) {
            showError('Por favor ingresa un email válido');
            return;
        }
        
        if (!validateVenezuelanPhone(phone)) {
            showError('Por favor ingresa un número de teléfono venezolano válido');
            return;
        }
        
        if (name.length < 2) {
            showError('El nombre debe tener al menos 2 caracteres');
            return;
        }
        
        if (restaurantName.length < 2) {
            showError('El nombre del restaurante debe tener al menos 2 caracteres');
            return;
        }
        
        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }
        
        showLoading();
        
        try {
            // Marcar código como usado
            markCodeAsUsed(code, 'owner');
            
            // Simular registro exitoso
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            showSuccess('¡Cuenta de propietario creada exitosamente! Redirigiendo...');
            
            // Guardar datos de usuario
            localStorage.setItem('userType', 'propietario');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', name);
            localStorage.setItem('loginTimestamp', new Date().toISOString());
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
                window.location.href = 'directorio.html';
            }, 2000);
            
        } catch (error) {
            showError('Error completando el registro. Por favor intenta de nuevo.');
            console.error('Registration error:', error);
        } finally {
            hideLoading();
        }
        
    } else {
        // SOLICITUD TRADICIONAL (código inválido o no proporcionado)
        const formData = {
            type: 'propietario',
            name: name,
            email: email,
            phone: phone,
            restaurantName: restaurantName,
            restaurantAddress: restaurantAddress,
            businessLicense: businessLicense,
            reason: reason,
            files: files,
            timestamp: new Date().toISOString()
        };
        
        // Validaciones básicas
        if (!validateEmail(formData.email)) {
            showError('Por favor ingresa un email válido');
            return;
        }
        
        if (!validateVenezuelanPhone(formData.phone)) {
            showError('Por favor ingresa un número de teléfono venezolano válido');
            return;
        }
        
        if (formData.reason.length < 20) {
            showError('Por favor proporciona una razón más detallada (mínimo 20 caracteres)');
            return;
        }
        
        showLoading();
        console.log('🚀 Enviando solicitud de propietario tradicional...');
        
        try {
            await sendRequestToDevs(formData);
            showSuccess('¡Solicitud enviada exitosamente! Los desarrolladores revisarán tu petición y te contactarán pronto por email.');
            document.getElementById('requestPropietarioForm').reset();
            resetFileInput('propietarioFiles');
            
        } catch (error) {
            showError('Error al enviar la solicitud. Se abrirá tu cliente de email como alternativa.');
            console.error('❌ Request error:', error);
            
            setTimeout(() => {
                sendEmailViaMailto(formData);
            }, 1000);
            
        } finally {
            hideLoading();
        }
    }
}

// Manejar solicitud/registro de administrador
async function handleRequestAdmin(e) {
    e.preventDefault();
    clearMessages();
    
    const code = document.getElementById('adminVerificationCode').value.trim();
    const name = document.getElementById('adminName').value;
    const email = document.getElementById('adminEmail').value;
    const phone = document.getElementById('adminPhone').value;
    const experience = document.getElementById('adminExperience').value;
    const motivation = document.getElementById('adminMotivation').value;
    const references = document.getElementById('adminReferences').value;
    const files = document.getElementById('adminFiles').files;
    
    // Verificar si es registro directo o solicitud
    const isDirectRegistration = validateAdminCode(code);
    
    if (isDirectRegistration) {
        // REGISTRO DIRECTO CON CÓDIGO VÁLIDO
        const password = document.getElementById('adminPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;
        const permissions = document.getElementById('adminPermissions').value;
        
        // Validaciones para registro directo
        if (!validateEmail(email)) {
            showError('Por favor ingresa un email válido');
            return;
        }
        
        if (!validateVenezuelanPhone(phone)) {
            showError('Por favor ingresa un número de teléfono venezolano válido');
            return;
        }
        
        if (name.length < 2) {
            showError('El nombre debe tener al menos 2 caracteres');
            return;
        }
        
        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }
        
        if (!permissions) {
            showError('Por favor selecciona el nivel de permisos');
            return;
        }
        
        showLoading();
        
        try {
            // Marcar código como usado
            markCodeAsUsed(code, 'admin');
            
            // Simular registro exitoso
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            showSuccess('¡Cuenta de administrador creada exitosamente! Redirigiendo...');
            
            // Guardar datos de usuario
            localStorage.setItem('userType', 'administrador');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', name);
            localStorage.setItem('adminPermissions', permissions);
            localStorage.setItem('loginTimestamp', new Date().toISOString());
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
                window.location.href = 'directorio.html';
            }, 2000);
            
        } catch (error) {
            showError('Error completando el registro. Por favor intenta de nuevo.');
            console.error('Registration error:', error);
        } finally {
            hideLoading();
        }
        
    } else {
        // SOLICITUD TRADICIONAL (código inválido o no proporcionado)
        const formData = {
            type: 'administrador',
            name: name,
            email: email,
            phone: phone,
            experience: experience,
            motivation: motivation,
            references: references,
            files: files,
            timestamp: new Date().toISOString()
        };
        
        // Validaciones básicas
        if (!validateEmail(formData.email)) {
            showError('Por favor ingresa un email válido');
            return;
        }
        
        if (!validateVenezuelanPhone(formData.phone)) {
            showError('Por favor ingresa un número de teléfono venezolano válido');
            return;
        }
        
        if (formData.experience.length < 50) {
            showError('Por favor describe tu experiencia de manera más detallada (mínimo 50 caracteres)');
            return;
        }
        
        if (formData.motivation.length < 30) {
            showError('Por favor explica tu motivación de manera más detallada (mínimo 30 caracteres)');
            return;
        }
        
        showLoading();
        console.log('🚀 Enviando solicitud de administrador tradicional...');
        
        try {
            await sendRequestToDevs(formData);
            showSuccess('¡Solicitud enviada exitosamente! Los desarrolladores revisarán tu petición y te contactarán pronto por email.');
            document.getElementById('requestAdminForm').reset();
            resetFileInput('adminFiles');
            
        } catch (error) {
            showError('Error al enviar la solicitud. Se abrirá tu cliente de email como alternativa.');
            console.error('❌ Request error:', error);
            
            setTimeout(() => {
                sendEmailViaMailto(formData);
            }, 1000);
            
        } finally {
            hideLoading();
        }
    }
}

// Manejar selección de archivos
function handleFileSelect(e) {
    const files = e.target.files;
    const fileInput = e.target.parentElement;
    const fileText = fileInput.querySelector('p');
    
    if (files.length > 0) {
        if (files.length === 1) {
            fileText.textContent = `Archivo seleccionado: ${files[0].name}`;
        } else {
            fileText.textContent = `${files.length} archivos seleccionados`;
        }
        fileText.style.color = '#28a745';
    } else {
        fileText.textContent = 'Haz clic para subir documentos';
        fileText.style.color = '';
    }
}

// Resetear input de archivos
function resetFileInput(inputId) {
    const input = document.getElementById(inputId);
    const fileText = input.parentElement.querySelector('p');
    fileText.textContent = 'Haz clic para subir documentos';
    fileText.style.color = '';
}

// Acceso como invitado
function accessAsGuest() {
    if (confirm('¿Deseas continuar como invitado? Tendrás acceso limitado a algunas funciones.')) {
        localStorage.setItem('userType', 'invitado');
        localStorage.setItem('loginTimestamp', new Date().toISOString());
        window.location.href = 'directorio.html';
    }
}

// Funciones para volver al registro
function goBackToRegistration() {
    document.getElementById('rejectionMessage').classList.remove('active');
    switchTab('register');
}

// Banner shrink on scroll
window.addEventListener('scroll', function() {
    const header = document.getElementById('mainHeader');
    if (window.scrollY > 0) {
        header.classList.add('shrink');
    } else {
        header.classList.remove('shrink');
    }
});

// Función de debug para probar códigos
window.testCodes = function() {
    console.log('🧪 Probando sistema de códigos...');
    loadVerificationCodes();
    console.log('📋 Códigos owner:', ownerCodes);
    console.log('📋 Códigos admin:', adminCodes);
    
    // Probar validación
    const testOwnerCode = '123456';
    const testAdminCode = '654321';
    
    console.log(`🔍 Test owner code ${testOwnerCode}:`, validateOwnerCode(testOwnerCode));
    console.log(`🔍 Test admin code ${testAdminCode}:`, validateAdminCode(testAdminCode));
};

// CSS para los estados de códigos
const codeStyles = document.createElement('style');
codeStyles.innerHTML = `
    .code-status {
        transition: all 0.3s ease;
        padding: 0.5rem;
        border-radius: 6px;
        font-weight: 500;
    }
`;
document.head.appendChild(codeStyles);

console.log('🎯 Sistema de códigos de verificación inicializado');