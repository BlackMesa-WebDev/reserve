let menuVisible = false;
//Función que oculta o muestra el menu
function mostrarOcultarMenu(){
    if(menuVisible){
        document.getElementById("nav").classList ="";
        menuVisible = false;
    }else{
        document.getElementById("nav").classList ="responsive";
        menuVisible = true;
    }
}

function seleccionar(){
    //oculto el menu una vez que selecciono una opcion
    document.getElementById("nav").classList = "";
    menuVisible = false;
}
//Funcion que aplica las animaciones de las habilidades
function efectoHabilidades(){
    var skills = document.getElementById("skills");
    var distancia_skills = window.innerHeight - skills.getBoundingClientRect().top;
    if(distancia_skills >= 300){
        let habilidades = document.getElementsByClassName("progreso");
        habilidades[0].classList.add("javascript");
        habilidades[1].classList.add("htmlcss");
        habilidades[2].classList.add("canva");
        habilidades[3].classList.add("wordpress");
        habilidades[4].classList.add("python");
        habilidades[5].classList.add("comunicacion");
        habilidades[6].classList.add("trabajo");
        habilidades[7].classList.add("creatividad");
        habilidades[8].classList.add("dedicacion");
        habilidades[9].classList.add("puntualidad");
    }
}


//detecto el scrolling para aplicar la animacion de la barra de habilidades
window.onscroll = function(){
    efectoHabilidades();
} 

document.querySelector('.col button').addEventListener('click', function() {
    var nombre = document.querySelector('.col input[placeholder="Tú Nombre"]').value;
    var telefono = document.querySelector('.col input[placeholder="Número telefónico"]').value;
    var correo = document.querySelector('.col input[placeholder="Dirección de correo"]').value;
    var tema = document.querySelector('.col input[placeholder="Tema"]').value;
    var mensaje = document.querySelector('.col textarea').value;

    var mailtoLink = 'mailto:jeffersonrosales2014@gmail.com' +
        '?subject=' + encodeURIComponent(tema) +
        '&body=' + encodeURIComponent('Nombre: ' + nombre + '\nTeléfono: ' + telefono + '\nCorreo: ' + correo + '\n\nMensaje:\n' + mensaje);

    window.location.href = mailtoLink;
});