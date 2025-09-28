document.addEventListener("DOMContentLoaded", () => {
  const sections = [
    document.querySelector("#dashboard-section"),
    document.querySelector("#map-section"),
    document.querySelector("#event_list-section")
  ];
  
  const navButtons = [
    document.querySelector('a[href="#dashboard-section"] .nav-item'),
    document.querySelector('a[href="#map-section"] .nav-item'),
    document.querySelector('a[href="#event_list-section"] .nav-item')
  ];

  function setActiveButton() {
    const scrollPosition = window.scrollY + window.innerHeight / 2; // Usar centro de la ventana
    let currentIndex = 0;
    
    // Verificar qué sección está más visible
    sections.forEach((section, i) => {
      if (section) {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const sectionBottom = sectionTop + rect.height;
        
        // Si la sección está visible en el centro de la pantalla
        if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
          currentIndex = i;
        }
      }
    });

    // Remover clase active de todos los botones
    navButtons.forEach(btn => {
      if (btn) btn.classList.remove("active");
    });
    
    // Añadir clase active al botón correspondiente
    if (navButtons[currentIndex]) {
      navButtons[currentIndex].classList.add("active");
    }
  }

  // Función alternativa más simple basada en Intersection Observer
  function setupIntersectionObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Activar cuando esté en el tercio superior de la pantalla
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const targetButton = document.querySelector(`a[href="#${sectionId}"] .nav-item`);
          
          // Remover active de todos
          navButtons.forEach(btn => {
            if (btn) btn.classList.remove("active");
          });
          
          // Añadir active al correspondiente
          if (targetButton) {
            targetButton.classList.add("active");
          }
        }
      });
    }, observerOptions);

    // Observar todas las secciones
    sections.forEach(section => {
      if (section) {
        observer.observe(section);
      }
    });
  }

  // Usar Intersection Observer (método más eficiente)
  setupIntersectionObserver();
  
  // Fallback con scroll listener
  setActiveButton();

  // Click en botones de navegación
  navButtons.forEach((btn, i) => {
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        
        if (sections[i]) {
          // Scroll suave a la sección
          sections[i].scrollIntoView({ 
            behavior: "smooth",
            block: "start" // Alinear al inicio de la sección
          });
          
          // Actualizar manualmente el estado activo
          setTimeout(() => {
            navButtons.forEach(button => {
              if (button) button.classList.remove("active");
            });
            btn.classList.add("active");
          }, 100);
        }
      });
    }
  });
});