<template>
  <div v-if="showLanding" class="landing-page">
    <nav class="nav">
      <div class="nav-container">
        <router-link to="/" class="nav-figure">
          <img src="../../imagenes/logo.png" class="nav-logo" alt="Logo Cronos" />
        </router-link>

        <label class="nav-toggle" for="menu-input">
          <input type="checkbox" id="menu-input" class="nav-input" />
        </label>

        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/inicio-sesion" class="nav-link">Inicia sesión</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/registro" class="nav-link">Registro</router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <!-- Logo -->
        <div class="logo-container">
          <span class="material-symbols-outlined logo-icon">
            <img src="../../imagenes/logo1.png" class="img-landing" alt="Logo Cronos" />
          </span>
        </div>

        <p class="hero-subtitle">
          Sistema de Gestión de Horarios UTEQ
        </p>

        <p class="hero-description">
          La plataforma centralizada que revoluciona la gestión académica. 
          Automatiza la creación de horarios, elimina errores en la asignación 
          de aulas y mantén a toda la comunidad educativa informada en tiempo real.
        </p>
      </div>

      <!-- Scroll indicator con texto -->
      <div class="scroll-indicator" @click="scrollToFeatures">
        <p class="scroll-text">Ver más</p>
        <div class="scroll-arrow"></div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="features-container">
        <h2 class="section-title">¿Por qué Cronos?</h2>
        <p class="section-subtitle">
          Soluciones inteligentes para una gestión académica eficiente
        </p>

        <div class="features-grid">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="feature-card"
          >
            <div class="feature-icon">
              <span class="material-symbols-outlined">{{ feature.icon }}</span>
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Cómo usar Cronos - Carousel Section -->
    <section class="how-to-use">
      <div class="how-to-container">
        <h2 class="section-title">¿Cómo usar Cronos?</h2>
        <p class="section-subtitle">
          Descubre las funcionalidades principales de la plataforma
        </p>

        <div class="carousel-container">
          <!-- Carousel Navigation Dots -->
          <div class="carousel-dots">
            <button 
              v-for="(step, index) in steps" 
              :key="index"
              :class="['dot', { active: currentStep === index }]"
              @click="goToStep(index)"
              :aria-label="`Ir al paso ${index + 1}`"
            ></button>
          </div>

          <!-- Carousel Content -->
          <div class="carousel-content">
            <transition name="fade" mode="out-in">
              <div :key="currentStep" class="step-card">
                <div class="step-icon">
                  <span class="material-symbols-outlined">{{ steps[currentStep].icon }}</span>
                </div>
                <h3 class="step-title">{{ steps[currentStep].title }}</h3>
                <p class="step-description">{{ steps[currentStep].description }}</p>
              </div>
            </transition>
          </div>

          <!-- Carousel Controls -->
          <div class="carousel-controls">
            <button 
              class="carousel-btn carousel-btn-prev" 
              @click="prevStep"
              :disabled="currentStep === 0"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button 
              class="carousel-btn carousel-btn-next" 
              @click="nextStep"
              :disabled="currentStep === steps.length - 1"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
      <div class="stats-grid">
        <div 
          v-for="(stat, index) in stats" 
          :key="index"
          class="stat-item"
        >
          <div class="stat-icon">
            <span class="material-symbols-outlined">{{ stat.icon }}</span>
          </div>
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-info">
          <div class="footer-section">
            <h4 class="footer-section-title">Contacto</h4>
            <div class="footer-contact-item">
              <span class="material-symbols-outlined">mail</span>
              <a href="mailto:cronos.school2025@gmail.com">cronos.school2025@gmail.com</a>
            </div>
            <div class="footer-contact-item">
              <span class="material-symbols-outlined">location_on</span>
              <span>Santiago de Querétaro, Querétaro</span>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-text">
            © 2024 Cronos - Sistema de Gestión de Horarios
          </p>
          <p class="footer-text-small">
            Optimizando la educación, un horario a la vez
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showLanding = ref(false)

const features = ref([
  {
    icon: 'calendar_month',
    title: 'Gestión Automatizada',
    description: 'Crea y administra horarios académicos de forma automática, eliminando errores manuales y ahorrando tiempo valioso.'
  },
  {
    icon: 'target',
    title: 'Asignación Inteligente',
    description: 'Optimiza la distribución de aulas, profesores y grupos con algoritmos inteligentes que evitan conflictos.'
  },
  {
    icon: 'devices',
    title: 'Acceso en Tiempo Real',
    description: 'Consulta horarios actualizados desde cualquier dispositivo, en cualquier momento y lugar.'
  },
  {
    icon: 'verified_user',
    title: 'Seguro y Confiable',
    description: 'Información protegida con los más altos estándares de seguridad y privacidad.'
  }
])

const stats = ref([
  { icon: 'trending_up', number: '80%', label: 'Mejora en comunicación' },
  { icon: 'check_circle', number: '100%', label: 'Reducción de errores' },
  { icon: 'schedule', number: '24/7', label: 'Disponibilidad' }
])

const steps = ref([
  {
    icon: 'dashboard',
    title: '1. Dashboard',
    description: 'Accede al panel principal donde encontrarás un resumen completo de todas las funcionalidades. Visualiza de forma rápida horarios, materias y accesos directos a las diferentes secciones del sistema.'
  },
  {
    icon: 'list',
    title: '2. Gestión de Datos',
    description: 'Administra toda la información del sistema: materias, profesores, aulas y divisiones. Crea, edita o elimina registros de manera sencilla con nuestras listas organizadas y funcionales.'
  },
  {
    icon: 'edit_note',
    title: '3. Formularios',
    description: 'Utiliza nuestros formularios intuitivos para agregar o modificar información. Cada campo está diseñado para facilitar la captura de datos con validaciones en tiempo real.'
  },
  {
    icon: 'calendar_view_week',
    title: '4. Horarios',
    description: 'Consulta y genera horarios personalizados por división, profesor o aula. Visualiza de forma clara toda la distribución de clases con información detallada de cada sesión.'
  }
])

const currentStep = ref(0)
let intervalId = null

// Verificar sesión activa al cargar la página
const checkExistingSession = () => {
  const token = localStorage.getItem('access_token')
  const rol = localStorage.getItem('rol')
  
  if (token && rol) {
    // Hay una sesión activa, redirigir según el rol SIN mostrar la landing
    redirectByRole(rol)
    return true
  }
  return false
}

// Función para redirigir según el rol
const redirectByRole = (rol) => {
  switch (rol) {
    case 'estudiante':
      router.push({ name: 'alumno-home' })
      break
    case 'admin':
      router.push({ name: 'dashboard' })
      break
    case 'profesor':
      router.push({ name: 'profesor-home' })
      break
    default:
      // Si el rol no es válido, limpiar localStorage
      localStorage.clear()
  }
}

const nextStep = () => {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const goToStep = (index) => {
  currentStep.value = index
}

const startAutoPlay = () => {
  intervalId = setInterval(() => {
    if (currentStep.value < steps.value.length - 1) {
      currentStep.value++
    } else {
      currentStep.value = 0
    }
  }, 15000)
}

const stopAutoPlay = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const scrollToFeatures = () => {
  const element = document.getElementById('features')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

onBeforeMount(() => {
  // Verificar sesión ANTES de montar el componente
  const hasSession = checkExistingSession()
  if (!hasSession) {
    // Solo mostrar la landing si NO hay sesión activa
    showLanding.value = true
  }
})

onMounted(() => {
  // Solo iniciar el autoplay si la landing se está mostrando
  if (showLanding.value) {
    startAutoPlay()
  }
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
/* Import Google Material Symbols */
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  font-size: 24px;
}

.landing-page {
  font-family: 'Inter', sans-serif;
  color: #213547;
}

/* Hero Section */
.hero {
  min-height: 88vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
  background: #FFFFFF;
  position: relative;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 900px;
  animation: fadeInUp 1s ease;
}

.img-landing {
  height: 250px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  margin-bottom: 80px;
  animation: scaleIn 0.8s ease;
  margin-top: -40px;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.hero-title {
  font-size: 56px;
  font-weight: 700;
  color: #213547;
  margin-bottom: 20px;
  line-height: 1.2;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 24px;
  font-weight: 500;
  color: #213547;
  margin-bottom: 15px;
  opacity: 0.95;
}

.hero-description {
  font-size: 18px;
  font-weight: 400;
  color: #213547;
  line-height: 1.6;
  margin-bottom: 40px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0.9;
}

.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  animation: bounce 2s infinite;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.scroll-text {
  font-size: 14px;
  font-weight: 500;
  color: #3ABEF9;
  margin: 0;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-10px); }
  60% { transform: translateX(-50%) translateY(-5px); }
}

.scroll-arrow {
  width: 30px;
  height: 30px;
  border-left: 3px solid #3ABEF9;
  border-bottom: 3px solid #3ABEF9;
  transform: rotate(-45deg);
}

/* Features Section */
.features {
  padding: 100px 20px;
  background: #DFF2FE;
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 42px;
  font-weight: 700;
  color: #213547;
  text-align: center;
  margin-bottom: 20px;
}

.section-subtitle {
  font-size: 20px;
  color: #213547;
  text-align: center;
  margin-bottom: 60px;
  opacity: 0.8;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
  margin-bottom: 60px;
}

.feature-card {
  background: #FFFFFF;
  padding: 40px 30px;
  border-radius: 16px;
  text-align: center;
  transition: all 0.4s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 40px rgba(58, 190, 249, 0.2);
}

.feature-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3ABEF9 0%, #88B7F3 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 25px;
}

.feature-icon .material-symbols-outlined {
  font-size: 48px !important;
  color: #FFFFFF;
}

.feature-title {
  font-size: 22px;
  font-weight: 600;
  color: #213547;
  margin-bottom: 15px;
}

.feature-description {
  font-size: 16px;
  color: #213547;
  line-height: 1.6;
  opacity: 0.8;
}

/* How to Use Section - Carousel */
.how-to-use {
  padding: 100px 20px;
  background: #FFFFFF;
}

.how-to-container {
  max-width: 900px;
  margin: 0 auto;
}

.carousel-container {
  position: relative;
  margin-top: 60px;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 40px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #A6E7F0;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: #3ABEF9;
  transform: scale(1.3);
}

.dot:hover {
  background: #88B7F3;
}

.carousel-content {
  min-height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-card {
  background: linear-gradient(135deg, #DFF2FE 0%, #FFFFFF 100%);
  padding: 50px 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  max-width: 700px;
  margin: 0 auto;
}

.step-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #3ABEF9 0%, #88B7F3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  box-shadow: 0 8px 24px rgba(58, 190, 249, 0.3);
}

.step-icon .material-symbols-outlined {
  font-size: 56px !important;
  color: #FFFFFF;
}

.step-title {
  font-size: 28px;
  font-weight: 700;
  color: #213547;
  margin-bottom: 20px;
}

.step-description {
  font-size: 18px;
  color: #213547;
  line-height: 1.8;
  opacity: 0.85;
}

.carousel-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.carousel-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #3ABEF9;
  color: #FFFFFF;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(58, 190, 249, 0.3);
}

.carousel-btn:hover:not(:disabled) {
  background: #29A9E0;
  transform: scale(1.1);
}

.carousel-btn:disabled {
  background: #A6E7F0;
  cursor: not-allowed;
  opacity: 0.5;
}

.carousel-btn .material-symbols-outlined {
  font-size: 32px !important;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Stats Section */
.stats {
  background: linear-gradient(135deg, #88B7F3 0%, #3ABEF9 100%);
  padding: 80px 20px;
  text-align: center;
}

.stats-grid {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
}

.stat-item {
  color: #FFFFFF;
}

.stat-icon {
  margin-bottom: 15px;
}

.stat-icon .material-symbols-outlined {
  font-size: 56px !important;
  color: #FFFFFF;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 52px;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 18px;
  font-weight: 500;
  opacity: 0.95;
}

/* Footer */
.footer {
  background: #FFFFFF;
  color: #213547;
  padding: 60px 20px 30px;
  border-top: 1px solid #A6E7F0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
  text-align: left;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.footer-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #213547;
  margin-bottom: 10px;
}

.footer-contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  line-height: 20px;
  color: #213547;
}

.footer-contact-item .material-symbols-outlined {
  color: #3ABEF9;
  font-size: 20px !important;
}

.footer-contact-item a {
  color: #213547;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-contact-item a:hover {
  color: #3ABEF9;
}

.footer-bottom {
  border-top: 1px solid #A6E7F0;
  padding-top: 25px;
  text-align: center;
}

.footer-text {
  font-size: 14px;
  line-height: 20px;
  color: #213547;
  opacity: 0.8;
  margin-bottom: 8px;
}

.footer-text-small {
  font-size: 13px;
  line-height: 18px;
  color: #213547;
  opacity: 0.6;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 38px;
  }

  .hero-subtitle {
    font-size: 20px;
  }

  .hero-description {
    font-size: 16px;
  }

  .section-title {
    font-size: 32px;
  }

  .section-subtitle {
    font-size: 18px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .stat-number {
    font-size: 40px;
  }

  .stat-label {
    font-size: 16px;
  }

  .footer-info {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .footer-section {
    align-items: center;
  }

  .footer-contact-item {
    justify-content: center;
  }

  .step-card {
    padding: 40px 30px;
  }

  .step-title {
    font-size: 24px;
  }

  .step-description {
    font-size: 16px;
  }

  .carousel-content {
    min-height: 400px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .img-landing {
    height: 180px;
  }

  .step-card {
    padding: 30px 20px;
  }

  .step-icon {
    width: 80px;
    height: 80px;
  }

  .step-icon .material-symbols-outlined {
    font-size: 48px !important;
  }

  .carousel-btn {
    width: 45px;
    height: 45px;
  }
}
</style>