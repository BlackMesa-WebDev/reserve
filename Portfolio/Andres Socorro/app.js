  particlesJS('particles-js', {
            particles: {
                number: {
                    value: 50,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#00ffcc'
                },
                shape: {
                    type: 'circle',
                },
                opacity: {
                    value: 0.5,
                    random: false,
                },
                size: {
                    value: 3,
                    random: true,
                },
                line_linked: {
                    enable: false,
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: true,
                    out_mode: 'out',
                    bounce: false,
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'repulse'
                    },
                    onclick: {
                        enable: false,
                    },
                    resize: true
                }
            },
            retina_detect: true
        });
 
 // Nuevo script para el rastro del cursor
        document.addEventListener('DOMContentLoaded', () => {
            const trailLength = 10;
            const trailDots = [];

            // Crear los trail dots y agregarlos al body
            for (let i = 0; i < trailLength; i++) {
            const dot = document.createElement('div');
            dot.classList.add('cursor-trail');
            dot.style.opacity = 1 - i * 0.1;
            dot.style.transform = `translate(-50%, -50%) scale(${1 - i * 0.1})`;
            document.body.appendChild(dot);
            trailDots.push(dot);
            }

            const positions = Array(trailLength).fill({ x: -100, y: -100 });

            document.addEventListener('mousemove', (e) => {
            positions.unshift({ x: e.clientX, y: e.clientY });
            positions.length = trailLength;

            trailDots.forEach((dot, idx) => {
                dot.style.left = `${positions[idx].x}px`;
                dot.style.top = `${positions[idx].y}px`;
            });
            });
        });

//Formulario de contacto        
        document.querySelector('.col button').addEventListener('click', function() {
    var nombre = document.querySelector('.col input[placeholder="Tú Nombre"]').value;
    var telefono = document.querySelector('.col input[placeholder="Número telefónico"]').value;
    var correo = document.querySelector('.col input[placeholder="Dirección de correo"]').value;
    var tema = document.querySelector('.col input[placeholder="Tema"]').value;
    var mensaje = document.querySelector('.col textarea').value;

    var mailtoLink = 'mailto:unisocorroandres@gmail.com' + 
        '?subject=' + encodeURIComponent(tema) + 
        '&body=' + encodeURIComponent('Nombre: ' + nombre + '\nTeléfono: ' + telefono + '\nCorreo: ' + correo + '\n\nMensaje:\n' + mensaje);

    window.location.href = mailtoLink;
});