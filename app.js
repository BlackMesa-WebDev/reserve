 // === SISTEMA DE ROLES Y AUTENTICACIÓN ===
        let currentUserRole = 'guest'; // guest, customer, owner, admin
        let selectedRole = 'guest';
        
        // === DATOS Y CONFIGURACIÓN ===
        let restaurants = [];
        let filteredRestaurants = [];
        let currentSlide = 0;
        let autoSlideInterval;
        let isEditing = false;
        let editingId = null;

        // === INICIALIZACIÓN ===
        document.addEventListener('DOMContentLoaded', function() {
            loadUserRole();
            loadRestaurants();
            renderRestaurants();
            startCarousel();
            updateUIForRole();
            
            // Cerrar dropdown al hacer clic fuera
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.user-menu')) {
                    document.getElementById('userDropdown').classList.remove('show');
                }
            });
        });

        // === SISTEMA DE ROLES ===
        function loadUserRole() {
            const savedRole = localStorage.getItem('userRole');
            currentUserRole = savedRole || 'guest';
            updateUserDisplay();
        }

        function saveUserRole() {
            localStorage.setItem('userRole', currentUserRole);
        }

        function updateUserDisplay() {
            const roleText = document.getElementById('userRoleText');
            const roleBadge = document.getElementById('userRoleBadge');
            
            const roleConfig = {
                guest: { text: 'Invitado', class: 'role-guest' },
                customer: { text: 'Comensal', class: 'role-customer' },
                owner: { text: 'Dueño de Restaurante', class: 'role-owner' },
                admin: { text: 'Administrador', class: 'role-admin' }
            };

            const config = roleConfig[currentUserRole];
            roleText.textContent = config.text;
            roleBadge.textContent = config.text;
            roleBadge.className = `role-badge ${config.class}`;
        }

        function updateUIForRole() {
            const addBtn = document.getElementById('addRestaurantBtn');
            const reportsBtn = document.querySelector('[onclick="showReports()"]');
            
            // Control del botón "Agregar Restaurante" según el rol
            switch(currentUserRole) {
                case 'guest':
                    // INVITADO: Sin acceso a ninguna función
                    addBtn.style.display = 'none';
                    if (reportsBtn) reportsBtn.style.display = 'none';
                    break;
                    
                case 'customer':
                    // COMENSAL: No puede agregar restaurantes, solo ver reportes básicos
                    addBtn.style.display = 'none';
                    if (reportsBtn) reportsBtn.style.display = 'flex';
                    break;
                    
                case 'owner':
                    // PROPIETARIO: Puede agregar hasta 5 restaurantes
                    addBtn.style.display = 'flex';
                    if (reportsBtn) reportsBtn.style.display = 'flex';
                    
                    // Verificar límite de restaurantes del propietario
                    const ownerRestaurants = restaurants.filter(r => r.ownerId === getUserId());
                    if (ownerRestaurants.length >= 5) {
                        addBtn.disabled = true;
                        addBtn.innerHTML = '<i class="fas fa-lock"></i> Límite Alcanzado (5/5)';
                        addBtn.title = 'Has alcanzado el límite máximo de 5 restaurantes';
                    } else {
                        addBtn.disabled = false;
                        addBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar Restaurante';
                        addBtn.title = `Agregar restaurante (${ownerRestaurants.length}/5)`;
                    }
                    break;
                    
                case 'admin':
                    // ADMINISTRADOR: God Mode - puede hacer todo
                    addBtn.style.display = 'flex';
                    addBtn.disabled = false;
                    addBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar Restaurante';
                    if (reportsBtn) reportsBtn.style.display = 'flex';
                    break;
            }
            
            // Re-renderizar restaurantes para mostrar acciones correctas
            renderRestaurants();
            
            // Actualizar otros elementos de la UI
            updateNavigationForRole();
        }

        function updateNavigationForRole() {
            // Actualizar visibilidad de otros botones según el rol
            const clearBtn = document.querySelector('[onclick="clearSearch()"]');
            
            if (currentUserRole === 'guest') {
                // Los invitados pueden buscar y limpiar búsquedas, pero nada más
                if (clearBtn) clearBtn.style.display = 'flex';
            }
        }

        function checkPermission(action, restaurantId = null) {
            switch(action) {
                case 'view':
                    // Todos pueden ver la lista de restaurantes
                    return true;
                    
                case 'visit':
                    if (currentUserRole === 'guest') {
                        showNotification('Si quieres hacer este movimiento, debes iniciar sesión', 'error');
                        setTimeout(() => {
                            openLoginModal();
                        }, 1500);
                        return false;
                    }
                    return true;
                    
                case 'reserve':
                    if (currentUserRole === 'guest') {
                        showNotification('Si quieres hacer este movimiento, debes iniciar sesión', 'error');
                        setTimeout(() => {
                            openLoginModal();
                        }, 1500);
                        return false;
                    }
                    return true;
                    
                case 'add':
                    if (currentUserRole === 'guest') {
                        showNotification('Si quieres hacer este movimiento, debes iniciar sesión', 'error');
                        setTimeout(() => {
                            openLoginModal();
                        }, 1500);
                        return false;
                    }
                    
                    if (currentUserRole === 'customer') {
                        showNotification('Solo los propietarios y administradores pueden agregar restaurantes', 'error');
                        return false;
                    }
                    
                    if (currentUserRole === 'owner') {
                        const ownerRestaurants = restaurants.filter(r => r.ownerId === getUserId());
                        if (ownerRestaurants.length >= 5) {
                            showNotification('Has alcanzado el límite máximo de 5 restaurantes', 'error');
                            return false;
                        }
                    }
                    return true;
                    
                case 'edit':
                case 'delete':
                    if (currentUserRole === 'guest') {
                        showNotification('Si quieres hacer este movimiento, debes iniciar sesión', 'error');
                        setTimeout(() => {
                            openLoginModal();
                        }, 1500);
                        return false;
                    }
                    
                    if (currentUserRole === 'customer') {
                        showNotification('No tienes permisos para realizar esta acción', 'error');
                        return false;
                    }
                    
                    if (currentUserRole === 'owner') {
                        const restaurant = restaurants.find(r => r.id === restaurantId);
                        if (!restaurant || restaurant.ownerId !== getUserId()) {
                            showNotification('Solo puedes gestionar tus propios restaurantes', 'error');
                            return false;
                        }
                    }
                    
                    // Los administradores pueden hacer todo
                    return true;
                    
                case 'reports':
                    if (currentUserRole === 'guest') {
                        showNotification('Si quieres hacer este movimiento, debes iniciar sesión', 'error');
                        setTimeout(() => {
                            openLoginModal();
                        }, 1500);
                        return false;
                    }
                    return true;
                    
                default:
                    return false;
            }
        }

        function getUserId() {
            // Simular ID de usuario basado en el rol
            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = 'user_' + Date.now();
                localStorage.setItem('userId', userId);
            }
            return userId;
        }

        // === FUNCIONES DE USUARIO ===
        function toggleUserMenu() {
            const dropdown = document.getElementById('userDropdown');
            dropdown.classList.toggle('show');
        }

        function openLoginModal() {
            // Si existe un sistema de login externo, redirigir allí
            if (typeof redirectToLogin === 'function') {
                redirectToLogin();
                return;
            }
            
            // Si no, usar el modal interno
            document.getElementById('userDropdown').classList.remove('show');
            document.getElementById('loginModal').style.display = 'flex';
            
            // Seleccionar rol actual
            const currentOption = document.querySelector(`[data-role="${currentUserRole}"]`);
            if (currentOption) {
                selectRole(currentUserRole);
            }
        }

        function closeLoginModal() {
            document.getElementById('loginModal').style.display = 'none';
            // Limpiar selección
            document.querySelectorAll('.role-option').forEach(option => {
                option.classList.remove('selected');
            });
        }

        function selectRole(role) {
            selectedRole = role;
            
            // Actualizar UI de selección
            document.querySelectorAll('.role-option').forEach(option => {
                option.classList.remove('selected');
            });
            document.querySelector(`[data-role="${role}"]`).classList.add('selected');
        }

        function confirmRole() {
            currentUserRole = selectedRole;
            saveUserRole();
            updateUserDisplay();
            updateUIForRole();
            closeLoginModal();
            
            const roleNames = {
                guest: 'Invitado',
                customer: 'Comensal',
                owner: 'Dueño de Restaurante',
                admin: 'Administrador'
            };
            
            showNotification(`Ahora eres: ${roleNames[currentUserRole]}`, 'success');
        }

        // === SISTEMA DE CIERRE DE SESIÓN ===
        function logout() {
            // Mostrar confirmación
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                // Limpiar TODOS los datos de sesión
                const keysToRemove = [
                    'userRole',
                    'userType', 
                    'userEmail',
                    'userName',
                    'userId',
                    'loginTimestamp',
                    'adminPermissions',
                    'returnUrl'
                ];
                
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
                
                // Cerrar dropdown
                document.getElementById('userDropdown').classList.remove('show');
                
                // Mostrar mensaje de despedida
                showNotification('Sesión cerrada correctamente. Redirigiendo...', 'info');
                
                // Redirigir después de 2 segundos para que el usuario vea el mensaje
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        }

        function forceLogout(reason = 'Sesión expirada') {
            // Limpiar todos los datos
            localStorage.clear();
            
            // Mostrar mensaje
            showNotification(reason + '. Redirigiendo al login...', 'error');
            
            // Redirigir inmediatamente
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }

        function checkSessionValid() {
            const userType = localStorage.getItem('userType');
            const loginTimestamp = localStorage.getItem('loginTimestamp');
            
            // Si no hay datos de sesión, es invitado
            if (!userType || !loginTimestamp) {
                currentUserRole = 'guest';
                updateUserDisplay();
                updateUIForRole();
                return false;
            }
            
            // Verificar si la sesión ha expirado (opcional - 24 horas)
            const LOGIN_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas en millisegundos
            const loginTime = new Date(loginTimestamp);
            const now = new Date();
            
            if (now - loginTime > LOGIN_EXPIRY) {
                forceLogout('Sesión expirada por inactividad');
                return false;
            }
            
            return true;
        }

        // === GESTIÓN DE DATOS ===
        function loadRestaurants() {
            const saved = JSON.parse(localStorage.getItem('restaurants') || '[]');
            restaurants = saved;
            filteredRestaurants = [...restaurants];
        }

        function saveRestaurants() {
            localStorage.setItem('restaurants', JSON.stringify(restaurants));
        }

        // === FUNCIONES DEL CAROUSEL ===
        function startCarousel() {
            autoSlideInterval = setInterval(nextSlide, 4000);
            
            const carousel = document.querySelector('.carousel-container');
            carousel.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
            carousel.addEventListener('mouseleave', () => {
                clearInterval(autoSlideInterval);
                autoSlideInterval = setInterval(nextSlide, 4000);
            });
        }

        function updateCarousel() {
            const track = document.getElementById('carouselTrack');
            const dots = document.querySelectorAll('.control-dot');
            
            track.style.transform = `translateX(-${currentSlide * 25}%)`;
            
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % 4;
            updateCarousel();
        }

        function prevSlide() {
            currentSlide = (currentSlide - 1 + 4) % 4;
            updateCarousel();
        }

        function goToSlide(index) {
            currentSlide = index;
            updateCarousel();
        }

        // === RENDERIZADO DE RESTAURANTES ===
        function renderRestaurants() {
            const grid = document.getElementById('restaurantsGrid');
            
            if (filteredRestaurants.length === 0) {
                let emptyStateContent = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <i class="fas fa-search"></i>
                        <h3>No se encontraron restaurantes</h3>
                        <p>Intenta con otros términos de búsqueda`;
                        
                // Solo mostrar opción de agregar si el usuario puede hacerlo
                if (currentUserRole === 'owner' || currentUserRole === 'admin') {
                    emptyStateContent += ` o agrega un nuevo restaurante</p>
                        <button class="btn btn-primary" onclick="openAddModal()" style="margin-top: 1rem;">
                            <i class="fas fa-plus"></i> Agregar Restaurante
                        </button>`;
                } else {
                    emptyStateContent += `</p>`;
                }
                
                emptyStateContent += `</div>`;
                grid.innerHTML = emptyStateContent;
                return;
            }

            grid.innerHTML = filteredRestaurants.map(restaurant => {
                const canEdit = currentUserRole === 'admin' || 
                              (currentUserRole === 'owner' && restaurant.ownerId === getUserId());
                
                const canVisit = currentUserRole !== 'guest';
                
                return `
                    <div class="restaurant-card" data-id="${restaurant.id}">
                        <img src="${restaurant.image || getDefaultImage(restaurant.category)}" 
                             alt="${restaurant.name}" class="restaurant-image">
                        <div class="restaurant-info">
                            <h3 class="restaurant-name">${restaurant.name}</h3>
                            <span class="restaurant-category">${restaurant.category}</span>
                            <p class="restaurant-description">${restaurant.description}</p>
                            <div style="margin-bottom: 1rem; color: #94a3b8; font-size: 0.9rem;">
                                ${restaurant.phone ? `<p><i class="fas fa-phone"></i> ${restaurant.phone}</p>` : ''}
                                ${restaurant.address ? `<p><i class="fas fa-map-marker-alt"></i> ${restaurant.address}</p>` : ''}
                                ${currentUserRole === 'admin' || (currentUserRole === 'owner' && restaurant.ownerId === getUserId()) ? 
                                    `<p style="color: #667eea;"><i class="fas fa-user"></i> Propietario: ${restaurant.ownerId}</p>` : ''}
                            </div>
                            <div class="restaurant-actions">
                                <button class="btn-visit action-btn" onclick="visitRestaurant('${restaurant.id}')" 
                                        ${!canVisit ? 'disabled title="Debes iniciar sesión para visitar"' : ''}>
                                    <i class="fas fa-globe"></i> ${canVisit ? 'Visitar' : 'Iniciar Sesión'}
                                </button>
                                ${canEdit ? `
                                    <button class="btn-edit action-btn" onclick="editRestaurant('${restaurant.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-delete action-btn" onclick="deleteRestaurant('${restaurant.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function getDefaultImage(category) {
            const images = {
                'Mariscos': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                'Parrilla': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
                'Cafetería': 'https://images.unsplash.com/photo-1501339847302-c6db2621d774?w=400&h=300&fit=crop',
                'Postres': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
                'Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
                'Comida Rápida': 'https://images.unsplash.com/photo-1551615593-ef5fe247e8f7?w=400&h=300&fit=crop',
                'Gourmet': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
                'Comida Tradicional': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
                'Vegetariano': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
                'Comida Internacional': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'
            };
            return images[category] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
        }

        // === FUNCIONES DE BÚSQUEDA ===
        function searchRestaurants() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            
            if (searchTerm === '') {
                filteredRestaurants = [...restaurants];
            } else {
                filteredRestaurants = restaurants.filter(restaurant =>
                    restaurant.name.toLowerCase().includes(searchTerm) ||
                    restaurant.category.toLowerCase().includes(searchTerm) ||
                    restaurant.description.toLowerCase().includes(searchTerm)
                );
            }
            
            renderRestaurants();
        }

        function filterByCategory(category) {
            document.getElementById('searchInput').value = category;
            searchRestaurants();
            scrollToRestaurants();
        }

        function clearSearch() {
            document.getElementById('searchInput').value = '';
            filteredRestaurants = [...restaurants];
            renderRestaurants();
        }

        function scrollToRestaurants() {
            document.getElementById('restaurantsSection').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }

        // === GESTIÓN DE RESTAURANTES ===
        function openAddModal() {
            if (!checkPermission('add')) return;
            
            isEditing = false;
            editingId = null;
            document.getElementById('restaurantForm').reset();
            document.querySelector('#addModal h2').innerHTML = '<i class="fas fa-plus"></i> Agregar Restaurante';
            document.getElementById('addModal').style.display = 'flex';
        }

        function closeAddModal() {
            document.getElementById('addModal').style.display = 'none';
            document.getElementById('restaurantForm').reset();
            isEditing = false;
            editingId = null;
        }

        function addRestaurant(event) {
            event.preventDefault();
            
            if (!checkPermission(isEditing ? 'edit' : 'add', editingId)) return;
            
            const formData = new FormData(event.target);
            const restaurant = {
                id: isEditing ? editingId : 'rest_' + Date.now(),
                name: formData.get('name'),
                category: formData.get('category'),
                description: formData.get('description'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                image: null,
                ownerId: getUserId(),
                createdAt: isEditing ? restaurants.find(r => r.id === editingId)?.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const imageFile = document.getElementById('imageUpload').files[0];
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    restaurant.image = e.target.result;
                    finishSaveRestaurant(restaurant);
                };
                reader.readAsDataURL(imageFile);
            } else {
                if (isEditing) {
                    const existingRestaurant = restaurants.find(r => r.id === editingId);
                    restaurant.image = existingRestaurant?.image;
                }
                finishSaveRestaurant(restaurant);
            }
        }

        function finishSaveRestaurant(restaurant) {
            if (isEditing) {
                const index = restaurants.findIndex(r => r.id === editingId);
                if (index !== -1) {
                    // Mantener el propietario original si es admin editando
                    if (currentUserRole === 'admin' && restaurants[index].ownerId) {
                        restaurant.ownerId = restaurants[index].ownerId;
                    }
                    restaurants[index] = restaurant;
                }
            } else {
                restaurants.push(restaurant);
            }
            
            filteredRestaurants = [...restaurants];
            saveRestaurants();
            renderRestaurants();
            closeAddModal();
            
            showNotification(
                isEditing ? 'Restaurante actualizado exitosamente!' : 'Restaurante agregado exitosamente!',
                'success'
            );
        }

        function editRestaurant(id) {
            if (!checkPermission('edit', id)) return;
            
            const restaurant = restaurants.find(r => r.id === id);
            if (!restaurant) return;

            isEditing = true;
            editingId = id;

            document.getElementById('name').value = restaurant.name;
            document.getElementById('category').value = restaurant.category;
            document.getElementById('description').value = restaurant.description;
            document.getElementById('phone').value = restaurant.phone || '';
            document.getElementById('address').value = restaurant.address || '';

            document.querySelector('#addModal h2').innerHTML = '<i class="fas fa-edit"></i> Editar Restaurante';
            document.getElementById('addModal').style.display = 'flex';
        }

        function deleteRestaurant(id) {
            if (!checkPermission('delete', id)) return;
            
            const restaurant = restaurants.find(r => r.id === id);
            if (!restaurant) return;

            if (confirm(`¿Estás seguro de que quieres eliminar "${restaurant.name}"?`)) {
                restaurants = restaurants.filter(r => r.id !== id);
                filteredRestaurants = filteredRestaurants.filter(r => r.id !== id);
                saveRestaurants();
                renderRestaurants();
                showNotification('Restaurante eliminado exitosamente!', 'info');
            }
        }

        // === PÁGINA DEL RESTAURANTE CON FORMULARIO DE RESERVAS ===
        let currentRestaurant = null;

        function visitRestaurant(id) {
            if (!checkPermission('visit')) return;
            
            const restaurant = restaurants.find(r => r.id === id);
            if (!restaurant) return;

            currentRestaurant = restaurant;
            document.getElementById('directoryView').style.display = 'none';
            
            const restaurantPage = document.getElementById('restaurantPage');
            restaurantPage.style.display = 'block';

            document.getElementById('restaurantPageTitle').textContent = restaurant.name;
            document.getElementById('restaurantPageDescription').textContent = restaurant.description;
            document.getElementById('restaurantPageCategory').textContent = restaurant.category;

            loadReservationForm(restaurant);
            reportVisit(id);
        }

        function loadReservationForm(restaurant) {
            const reservationContainer = document.getElementById('menuItems');
            
            reservationContainer.innerHTML = `
                <div class="reservation-form-container" style="max-width: 600px; margin: 0 auto;">
                    <div style="background: rgba(20, 22, 34, 0.95); padding: 2rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <h3 style="color: #f1f5f9; margin-bottom: 1.5rem; text-align: center;">
                            <i class="fas fa-calendar-check"></i> Reservar Mesa
                        </h3>
                        
                        <form id="reservationForm" onsubmit="submitReservation(event)">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #c5c6c7; font-weight: 500;">
                                        <i class="fas fa-user"></i> Nombre Completo
                                    </label>
                                    <input type="text" id="reservationName" required
                                           style="width: 100%; padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid transparent; transition: all 0.3s ease;"
                                           placeholder="Tu nombre completo">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #c5c6c7; font-weight: 500;">
                                        <i class="fas fa-phone"></i> Teléfono
                                    </label>
                                    <input type="tel" id="reservationPhone" required
                                           style="width: 100%; padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid transparent; transition: all 0.3s ease;"
                                           placeholder="+58412XXXXXXX">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #c5c6c7; font-weight: 500;">
                                        <i class="fas fa-calendar"></i> Fecha
                                    </label>
                                    <input type="date" id="reservationDate" required
                                           style="width: 100%; padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid transparent; transition: all 0.3s ease;"
                                           min="${new Date().toISOString().split('T')[0]}">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #c5c6c7; font-weight: 500;">
                                        <i class="fas fa-clock"></i> Hora
                                    </label>
                                    <select id="reservationTime" required
                                            style="width: 100%; padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid transparent; transition: all 0.3s ease;">
                                        <option value="">Seleccionar hora</option>
                                        <option value="12:00">12:00 PM</option>
                                        <option value="12:30">12:30 PM</option>
                                        <option value="13:00">1:00 PM</option>
                                        <option value="13:30">1:30 PM</option>
                                        <option value="14:00">2:00 PM</option>
                                        <option value="14:30">2:30 PM</option>
                                        <option value="15:00">3:00 PM</option>
                                        <option value="18:00">6:00 PM</option>
                                        <option value="18:30">6:30 PM</option>
                                        <option value="19:00">7:00 PM</option>
                                        <option value="19:30">7:30 PM</option>
                                        <option value="20:00">8:00 PM</option>
                                        <option value="20:30">8:30 PM</option>
                                        <option value="21:00">9:00 PM</option>
                                        <option value="21:30">9:30 PM</option>
                                        <option value="22:00">10:00 PM</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #c5c6c7; font-weight: 500;">
                                        <i class="fas fa-users"></i> Número de Personas
                                    </label>
                                    <select id="reservationPeople" required
                                            style="width: 100%; padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid transparent; transition: all 0.3s ease;">
                                        <option value="">Seleccionar</option>
                                        <option value="1">1 persona</option>
                                        <option value="2">2 personas</option>
                                        <option value="3">3 personas</option>
                                        <option value="4">4 personas</option>
                                        <option value="5">5 personas</option>
                                        <option value="6">6 personas</option>
                                        <option value="7">7 personas</option>
                                        <option value="8">8 personas</option>
                                        <option value="9">9+ personas</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #c5c6c7; font-weight: 500;">
                                        <i class="fas fa-envelope"></i> Email (Opcional)
                                    </label>
                                    <input type="email" id="reservationEmail"
                                           style="width: 100%; padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid transparent; transition: all 0.3s ease;"
                                           placeholder="tu@email.com">
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 1.5rem;">
                                <label style="display: block; margin-bottom: 0.5rem; color: #c5c6c7; font-weight: 500;">
                                    <i class="fas fa-comment"></i> Comentarios Especiales (Opcional)
                                </label>
                                <textarea id="reservationComments" rows="3"
                                          style="width: 100%; padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid transparent; transition: all 0.3s ease; resize: vertical;"
                                          placeholder="Alergias, preferencias de mesa, celebraciones especiales, etc."></textarea>
                            </div>
                            
                            <div style="display: flex; gap: 1rem; justify-content: center;">
                                <button type="button" onclick="goBackToDirectory()" 
                                        style="padding: 1rem 2rem; background: rgba(107, 114, 128, 0.8); border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                                    <i class="fas fa-arrow-left"></i> Volver
                                </button>
                                <button type="submit" 
                                        style="padding: 1rem 2rem; background: linear-gradient(45deg, #667eea, #764ba2); border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                                    <i class="fas fa-calendar-check"></i> Confirmar Reserva
                                </button>
                            </div>
                        </form>
                        
                        <div style="margin-top: 2rem; padding: 1rem; background: rgba(102, 126, 234, 0.1); border-radius: 8px; border-left: 4px solid #667eea;">
                            <h4 style="color: #667eea; margin-bottom: 0.5rem;">
                                <i class="fas fa-info-circle"></i> Información de Contacto
                            </h4>
                            <p style="color: #94a3b8; margin: 0; line-height: 1.5;">
                                ${restaurant.phone ? `<strong>Teléfono:</strong> ${restaurant.phone}<br>` : ''}
                                ${restaurant.address ? `<strong>Dirección:</strong> ${restaurant.address}<br>` : ''}
                                <strong>Categoría:</strong> ${restaurant.category}
                            </p>
                        </div>
                        
                        <div style="margin-top: 1rem; padding: 1rem; background: rgba(40, 167, 69, 0.1); border-radius: 8px; border-left: 4px solid #28a745;">
                            <h4 style="color: #28a745; margin-bottom: 0.5rem;">
                                <i class="fas fa-check-circle"></i> Política de Reservas
                            </h4>
                            <ul style="color: #94a3b8; margin: 0; padding-left: 1.2rem; line-height: 1.5;">
                                <li>Las reservas se confirman por teléfono o email</li>
                                <li>Cancelaciones hasta 2 horas antes</li>
                                <li>Mesa reservada por 15 minutos después de la hora</li>
                                <li>Grupos grandes contactar directamente</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }

        function submitReservation(event) {
            event.preventDefault();
            
            if (!checkPermission('reserve')) return;
            
            const formData = {
                restaurant: currentRestaurant.name,
                restaurantId: currentRestaurant.id,
                name: document.getElementById('reservationName').value,
                phone: document.getElementById('reservationPhone').value,
                date: document.getElementById('reservationDate').value,
                time: document.getElementById('reservationTime').value,
                people: document.getElementById('reservationPeople').value,
                email: document.getElementById('reservationEmail').value,
                comments: document.getElementById('reservationComments').value,
                timestamp: new Date().toISOString()
            };
            
            // Validaciones básicas
            if (!formData.name || !formData.phone || !formData.date || !formData.time || !formData.people) {
                showNotification('Por favor completa todos los campos obligatorios', 'error');
                return;
            }
            
            // Validar fecha no sea en el pasado
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                showNotification('No puedes reservar para fechas pasadas', 'error');
                return;
            }
            
            // Validar teléfono venezolano
            if (!validateVenezuelanPhone(formData.phone)) {
                showNotification('Por favor ingresa un número de teléfono venezolano válido', 'error');
                return;
            }
            
            // Guardar reserva
            saveReservation(formData);
            
            // Mostrar confirmación
            showReservationConfirmation(formData);
        }

        function validateVenezuelanPhone(phone) {
            const re = /^(\+58|58|0)?(4\d{9}|2\d{9})$/;
            return re.test(phone.replace(/\s|-/g, ''));
        }

        function saveReservation(reservationData) {
            let reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            reservationData.id = 'res_' + Date.now();
            reservationData.status = 'pendiente';
            reservations.push(reservationData);
            localStorage.setItem('reservations', JSON.stringify(reservations));
        }

        function showReservationConfirmation(data) {
            const confirmationHtml = `
                <div class="modal" style="display: flex;">
                    <div class="modal-content" style="max-width: 500px;">
                        <div style="text-align: center; margin-bottom: 2rem;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(45deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                <i class="fas fa-check" style="font-size: 2.5rem; color: white;"></i>
                            </div>
                            <h2 style="color: #f1f5f9; margin-bottom: 0.5rem;">¡Reserva Enviada!</h2>
                            <p style="color: #94a3b8;">Tu solicitud de reserva ha sido enviada correctamente</p>
                        </div>
                        
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                            <h3 style="color: #667eea; margin-bottom: 1rem;">
                                <i class="fas fa-clipboard-list"></i> Detalles de tu Reserva
                            </h3>
                            <div style="color: #c5c6c7; line-height: 1.6;">
                                <p><strong>Restaurante:</strong> ${data.restaurant}</p>
                                <p><strong>Nombre:</strong> ${data.name}</p>
                                <p><strong>Fecha:</strong> ${formatDate(data.date)}</p>
                                <p><strong>Hora:</strong> ${formatTime(data.time)}</p>
                                <p><strong>Personas:</strong> ${data.people} ${data.people == 1 ? 'persona' : 'personas'}</p>
                                <p><strong>Teléfono:</strong> ${data.phone}</p>
                                ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
                                ${data.comments ? `<p><strong>Comentarios:</strong> ${data.comments}</p>` : ''}
                            </div>
                        </div>
                        
                        <div style="background: rgba(102, 126, 234, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 2rem;">
                            <h4 style="color: #667eea; margin-bottom: 0.5rem;">
                                <i class="fas fa-info-circle"></i> Próximos Pasos
                            </h4>
                            <p style="color: #94a3b8; margin: 0; line-height: 1.5;">
                                El restaurante se contactará contigo para confirmar la disponibilidad y finalizar tu reserva. 
                                Por favor mantén tu teléfono disponible.
                            </p>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; justify-content: center;">
                            <button onclick="closeReservationConfirmation(); goBackToDirectory();" 
                                    class="btn btn-primary" style="padding: 1rem 2rem;">
                                <i class="fas fa-home"></i> Volver al Directorio
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            
            // Limpiar formulario
            document.getElementById('reservationForm').reset();
        }

        function closeReservationConfirmation() {
            const confirmationModal = document.querySelector('.modal[style*="display: flex"]');
            if (confirmationModal) {
                confirmationModal.remove();
            }
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        function formatTime(timeString) {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        }

        function goBackToDirectory() {
            document.getElementById('restaurantPage').style.display = 'none';
            document.getElementById('directoryView').style.display = 'block';
            currentRestaurant = null;
        }

        // === SISTEMA DE REPORTES ===
        function reportVisit(restaurantId) {
            let visits = JSON.parse(localStorage.getItem('restaurantVisits') || '{}');
            visits[restaurantId] = (visits[restaurantId] || 0) + 1;
            localStorage.setItem('restaurantVisits', JSON.stringify(visits));
        }

        function showReports() {
            if (!checkPermission('reports')) return;

            const visits = JSON.parse(localStorage.getItem('restaurantVisits') || '{}');
            const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            const restaurantMap = {};
            restaurants.forEach(r => restaurantMap[r.id] = r.name);

            // Filtrar datos según el rol
            let filteredVisits = visits;
            let filteredReservations = reservations;
            
            if (currentUserRole === 'owner') {
                // Solo mostrar estadísticas de los restaurantes propios
                const ownRestaurantIds = restaurants
                    .filter(r => r.ownerId === getUserId())
                    .map(r => r.id);
                
                filteredVisits = Object.fromEntries(
                    Object.entries(visits).filter(([id]) => ownRestaurantIds.includes(id))
                );
                
                filteredReservations = reservations.filter(r => ownRestaurantIds.includes(r.restaurantId));
            }

            let reportHtml = `
                <div class="modal" style="display: flex;">
                    <div class="modal-content" style="max-width: 700px;">
                        <h2><i class="fas fa-chart-bar"></i> Reportes del Sistema</h2>
                        
                        <div style="margin-bottom: 2rem;">
                            <h3 style="color: #667eea; margin-bottom: 1rem;">📊 Estadísticas Generales</h3>
                            ${currentUserRole === 'admin' ? 
                                `<p><strong>Total de restaurantes:</strong> ${restaurants.length}</p>
                                 <p><strong>Visitas totales:</strong> ${Object.values(visits).reduce((a, b) => a + b, 0)}</p>
                                 <p><strong>Reservas totales:</strong> ${reservations.length}</p>` 
                                : ''
                            }
                            ${currentUserRole === 'owner' ? 
                                `<p><strong>Tus restaurantes:</strong> ${restaurants.filter(r => r.ownerId === getUserId()).length}/5</p>
                                 <p><strong>Visitas a tus restaurantes:</strong> ${Object.values(filteredVisits).reduce((a, b) => a + b, 0)}</p>
                                 <p><strong>Reservas en tus restaurantes:</strong> ${filteredReservations.length}</p>` 
                                : ''
                            }
                            ${currentUserRole === 'customer' ? 
                                `<p><strong>Restaurantes disponibles:</strong> ${restaurants.length}</p>
                                 <p><strong>Total de visitas registradas:</strong> ${Object.values(visits).reduce((a, b) => a + b, 0)}</p>
                                 <p><strong>Tus reservas:</strong> ${reservations.filter(r => r.name === (localStorage.getItem('userName') || 'Usuario')).length}</p>` 
                                : ''
                            }
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                            <div>
                                <h3 style="color: #667eea; margin-bottom: 1rem;">🏆 Restaurantes Más Visitados</h3>
                                <div style="max-height: 200px; overflow-y: auto;">
                                    ${Object.entries(filteredVisits)
                                        .sort(([,a], [,b]) => b - a)
                                        .slice(0, 5)
                                        .map(([id, count]) => `
                                            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(102, 126, 234, 0.1); margin-bottom: 0.5rem; border-radius: 8px;">
                                                <span style="font-size: 0.9rem;">${restaurantMap[id] || 'Restaurante eliminado'}</span>
                                                <strong>${count} visitas</strong>
                                            </div>
                                        `).join('') || '<p style="text-align: center; color: #64748b;">Sin visitas registradas</p>'}
                                </div>
                            </div>
                            
                            <div>
                                <h3 style="color: #667eea; margin-bottom: 1rem;">📅 Reservas Recientes</h3>
                                <div style="max-height: 200px; overflow-y: auto;">
                                    ${filteredReservations
                                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                        .slice(0, 5)
                                        .map(reservation => `
                                            <div style="padding: 0.5rem; background: rgba(16, 185, 129, 0.1); margin-bottom: 0.5rem; border-radius: 8px;">
                                                <div style="font-size: 0.9rem; color: #c5c6c7;">
                                                    <strong>${reservation.name}</strong><br>
                                                    ${restaurantMap[reservation.restaurantId] || 'Restaurante'}<br>
                                                    ${formatDate(reservation.date)} - ${formatTime(reservation.time)}
                                                </div>
                                            </div>
                                        `).join('') || '<p style="text-align: center; color: #64748b;">Sin reservas registradas</p>'}
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            ${currentUserRole === 'admin' ? `
                                <button class="btn btn-secondary" onclick="clearReports()">
                                    <i class="fas fa-trash"></i> Limpiar Reportes
                                </button>
                            ` : ''}
                            <button class="btn btn-primary" onclick="closeReports()">
                                <i class="fas fa-times"></i> Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', reportHtml);
        }

        function clearReports() {
            if (currentUserRole !== 'admin') {
                showNotification('Solo los administradores pueden limpiar reportes', 'error');
                return;
            }
            
            if (confirm('¿Estás seguro de que quieres limpiar todos los reportes?')) {
                localStorage.removeItem('restaurantVisits');
                localStorage.removeItem('reservations');
                closeReports();
                showNotification('Reportes limpiados exitosamente!', 'info');
            }
        }

        function closeReports() {
            const reportModal = document.querySelector('.modal[style*="display: flex"]');
            if (reportModal) {
                reportModal.remove();
            }
        }

        // === SISTEMA DE NOTIFICACIONES ===
        function showNotification(message, type = 'info') {
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                info: '#667eea',
                warning: '#f59e0b'
            };

            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type]};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                z-index: 10001;
                font-weight: 500;
                opacity: 0;
                transform: translateX(100%) scale(0.8);
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                max-width: 400px;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0) scale(1)';
            }, 100);

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%) scale(0.8)';
                setTimeout(() => notification.remove(), 400);
            }, 4000);
        }

        // === EVENT LISTENERS GLOBALES ===
        
        // Cerrar modal al hacer clic fuera
        document.getElementById('addModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeAddModal();
            }
        });

        document.getElementById('loginModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeLoginModal();
            }
        });

        // Navegación con teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'Escape') {
                closeAddModal();
                closeLoginModal();
                closeReports();
                closeReservationConfirmation();
                document.getElementById('userDropdown').classList.remove('show');
            }
            
            // Logout rápido con Ctrl + Shift + L
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                logout();
            }
        });

        // Soporte táctil para el carousel
        let startX = 0;
        let endX = 0;

        const carousel = document.querySelector('.carousel-container');
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        });

        // === INTEGRACIÓN CON EL SISTEMA DE LOGIN (app2.js) ===
        function integrateWithLoginSystem() {
            // Verificar si hay datos de sesión del sistema de login
            const savedUserType = localStorage.getItem('userType');
            const savedUserEmail = localStorage.getItem('userEmail');
            const savedUserName = localStorage.getItem('userName');
            
            if (savedUserType && savedUserEmail) {
                // Mapear tipos de usuario del sistema de login al directorio
                const roleMapping = {
                    'invitado': 'guest',
                    'comensal': 'customer',
                    'propietario': 'owner',
                    'administrador': 'admin'
                };
                
                const mappedRole = roleMapping[savedUserType] || 'guest';
                
                // Actualizar rol actual
                currentUserRole = mappedRole;
                
                // Guardar en el formato del directorio
                localStorage.setItem('userRole', mappedRole);
                
                // Actualizar UI
                updateUserDisplay();
                updateUIForRole();
                
                console.log(`Usuario autenticado: ${savedUserName} (${savedUserEmail}) como ${mappedRole}`);
                
                // Mostrar mensaje de bienvenida
                showNotification(`Bienvenido ${savedUserName || savedUserEmail}`, 'success');
            }
        }

        function redirectToLogin() {
            // Guardar la URL actual para regresar después del login
            localStorage.setItem('returnUrl', window.location.href);
            
            // Redireccionar al sistema de login
            window.location.href = 'index.html';
        }

        // === DATOS DE EJEMPLO ===
        function loadSampleData() {
            if (restaurants.length === 0) {
                const sampleRestaurants = [
                    {
                        id: 'sample_1',
                        name: 'Mariscos El Puerto',
                        category: 'Mariscos',
                        description: 'Los mejores mariscos frescos del puerto, preparados con recetas tradicionales.',
                        phone: '+58412-1234567',
                        address: 'Av. Libertador, Puerto La Cruz',
                        image: null,
                        ownerId: 'sample_owner_1',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: 'sample_2',
                        name: 'Parrilla Don Pedro',
                        category: 'Parrilla',
                        description: 'Carnes premium a la parrilla con el mejor sabor tradicional venezolano.',
                        phone: '+58424-7654321',
                        address: 'Centro Comercial Plaza Mayor',
                        image: null,
                        ownerId: 'sample_owner_2',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: 'sample_3',
                        name: 'Café Central',
                        category: 'Cafetería',
                        description: 'Un espacio acogedor para disfrutar del mejor café y repostería artesanal.',
                        phone: '+58416-9876543',
                        address: 'Plaza Bolívar, Centro',
                        image: null,
                        ownerId: 'sample_owner_1',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ];
                
                restaurants = sampleRestaurants;
                filteredRestaurants = [...restaurants];
                saveRestaurants();
                renderRestaurants();
            }
        }

        // Cargar datos de ejemplo después de un momento
        setTimeout(loadSampleData, 1000);

        // === INICIALIZACIÓN MEJORADA ===
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🎯 Directorio BlackMesa iniciado');
            
            // Verificar sesión antes de todo
            checkSessionValid();
            
            // Integrar con sistema de login si existe
            integrateWithLoginSystem();
            
            // Continuar con inicialización normal
            loadUserRole();
            loadRestaurants();
            renderRestaurants();
            startCarousel();
            updateUIForRole();
            
            // Cerrar dropdown al hacer clic fuera
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.user-menu')) {
                    document.getElementById('userDropdown').classList.remove('show');
                }
            });
            
            console.log(`Sistema iniciado con usuario: ${currentUserRole}`);
            
            // Verificar sesión cada 5 minutos
            setInterval(checkSessionValid, 5 * 60 * 1000);
        });