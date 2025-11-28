<template>
  <div>
    <nav class="nav">
      <div class="nav-container">
        <router-link to="/alumno" class="nav-figure">
          <img src="../../imagenes/logo.png" class="nav-logo" alt="Logo Cronos" />
        </router-link>

        <label class="nav-toggle" for="menu-input">
          <input type="checkbox" id="menu-input" class="nav-input" />
        </label>

        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/alumno" class="nav-link">Inicio</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/alumno/perfil" class="nav-link">Perfil</router-link>
          </li>
        </ul>
      </div>
    </nav>

    <main class="main-content">
      <h1>Mi Horario</h1>

      <div class="horarios-multi-container">
        
        <!-- LOADING -->
        <div v-if="isLoading" class="loading-container">
          <div class="spinner"></div>
          <p>Cargando horario... Por favor espera.</p>
        </div>

        <!-- ERROR -->
        <div v-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="cargarHorario" class="btn-primary">Reintentar</button>
        </div>

        <!-- MENSAJE: NO PUBLICADO -->
        <div v-if="!isLoading && !error && !horarioPublicado" class="empty-state">
          <div class="empty-content">
            <h3>Horario no disponible</h3>
            <p>Tu horario aún no ha sido publicado. Por favor, contacta con tu coordinador académico.</p>
          </div>
        </div>

        <!-- MENSAJE: SIN GRUPO ASIGNADO -->
        <div v-if="!isLoading && !error && !grupoAlumno" class="empty-state">
          <div class="empty-content">
            <h3>Sin grupo asignado</h3>
            <p>No tienes un grupo asignado actualmente. Por favor, contacta con administración.</p>
          </div>
        </div>

        <!-- CONTENIDO: HORARIO -->
        <template v-if="!isLoading && !error && horarioPublicado && horarioData">
          
          <div class="horarios-cards-wrapper">
            <div class="horario-card horario-publicado">
              
              <!-- HEADER DE LA TARJETA -->
              <div class="horario-header">
                <div class="horario-info">
                  <p class="school-info">
                    <b>{{ nombreEscuela }}</b> | Período: <b>{{ periodoCuatrimestral }}</b>
                  </p>
                  <h2 class="horario-title">
                    Grupo: {{ horarioData.nombre }}
                  </h2>
                  
                  <p class="tutor-info">
                    Tutor: <b>{{ horarioData.tutor }}</b>
                  </p>
                  <p class="division-info">{{ divisionUniforme }}</p>
                </div>
                
                <div class="horario-actions">
                  <button 
                    @click="generarPDFIndividual" 
                    class="btn-danger btn-accion"
                  >
                  PDF
                  </button>
                </div>
              </div>

              <!-- LEYENDA DE COLORES -->
              <div class="leyenda-colores-individual">
                <h4 class="leyenda-titulo-individual">Materias:</h4>
                <div class="leyenda-items-individual">
                  <div 
                    v-for="leyendaItem in leyendaMaterias" 
                    :key="leyendaItem.nombre"
                    class="leyenda-item-individual"
                  >
                    <div 
                      class="leyenda-color-individual"
                      :style="{ backgroundColor: leyendaItem.color }"
                    ></div>
                    <span class="leyenda-nombre-individual">{{ leyendaItem.nombre }}</span>
                  </div>
                </div>
              </div>

              <!-- TABLA DE HORARIO -->
              <div class="horario-tabla-container">
                <table class="horario-grid">
                  <thead>
                    <tr>
                      <th class="hora-column">Hora</th>
                      <th v-for="dia in dias" :key="dia" class="dia-column">{{ dia.substring(0, 3) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="hora in horas" :key="hora">
                      <td class="hora-cell">{{ formatTimeRange(hora) }}</td>
                      
                      <td 
                        v-for="dia in dias" 
                        :key="dia"
                        class="clase-cell"
                        :style="getCeldaStyle(dia, hora)"
                      >
                        <template v-if="horarioData.data[dia] && horarioData.data[dia][hora]">
                          <div class="clase-content">
                            <div class="clase-materia">{{ horarioData.data[dia][hora].materia }}</div>
                            <div class="clase-profesor">{{ horarioData.data[dia][hora].profesor.split(' ')[0] }}</div>
                            <div class="clase-aula">{{ horarioData.data[dia][hora].aula }} - {{ horarioData.data[dia][hora].edificio }}</div>
                          </div>
                        </template>
                        <template v-else>
                          <div class="clase-empty"></div>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../../assets/styles.css';

// --- CONFIGURACIÓN ---
const nombreEscuela = ref('UTEQ');
const periodoCuatrimestral = ref('AGO-DIC 2025');
const divisionUniforme = ref('INGENIERÍA');
const dias = ref(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
const horas = ref(['17:00', '18:00', '19:00', '20:00', '21:00']);

// --- ESTADO ---
const isLoading = ref(false);
const error = ref(null);
const horarioData = ref(null);
const horarioPublicado = ref(false);
const grupoAlumno = ref(null); // ID del grupo del alumno

// --- URLs de las APIs ---
const NESTJS_API = `https://backend-production-04cf.up.railway.app`;


// --- FUNCIÓN PARA OBTENER EL ID DEL ALUMNO DESDE EL LOCAL STORAGE ---
const obtenerIdAlumnoDesdeLocalStorage = () => {
  try {
    const idRol = localStorage.getItem('id_rol');
    if (!idRol) {
      throw new Error('No hay id_rol en localStorage');
    }
    
    return parseInt(idRol);
  } catch (err) {
    console.error('Error al obtener id_rol:', err);
    throw new Error('No se pudo obtener el ID del estudiante');
  }
};

// --- FUNCIÓN PARA OBTENER EL GRUPO DEL ALUMNO ---
const obtenerGrupoAlumno = async () => {
  try {
    // Obtener el ID del alumno desde localStorage (id_rol)
    const idAlumno = obtenerIdAlumnoDesdeLocalStorage();
    
    console.log('ID del alumno (id_rol):', idAlumno);
    
    // Obtener información del estudiante desde el endpoint
    const response = await fetch(`${NESTJS_API}/estudiantes/${idAlumno}`);
    
    if (!response.ok) {
      throw new Error('No se pudo obtener la información del estudiante');
    }
    
    const estudiante = await response.json();
    console.log('Datos del estudiante:', estudiante);
    
    // Verificar que el estudiante tenga un grupo asignado
    if (!estudiante.id_grupo) {
      throw new Error('El estudiante no tiene un grupo asignado');
    }
    
    grupoAlumno.value = estudiante.id_grupo;
    
    return estudiante.id_grupo;
  } catch (err) {
    console.error('Error al obtener grupo del alumno:', err);
    throw err;
  }
};

// --- CARGAR HORARIO DEL GRUPO ---
const cargarHorario = async () => {
  isLoading.value = true;
  error.value = null;
  horarioPublicado.value = false;
  
  try {
    // Primero obtener el grupo del alumno
    const idGrupo = await obtenerGrupoAlumno();
    
    if (!idGrupo) {
      error.value = 'No tienes un grupo asignado';
      return;
    }
    
    console.log('Cargando horario del grupo:', idGrupo);
    
    // Obtener todos los horarios formateados
    const response = await fetch(`${NESTJS_API}/horario-profesor-asignatura/grupos/formateados`);
    
    if (!response.ok) {
      throw new Error(`Error al cargar horarios: ${response.status}`);
    }
    
    const todosLosHorarios = await response.json();
    console.log('Horarios obtenidos:', todosLosHorarios);
    
    // Buscar el horario del grupo específico del alumno
    const horarioGrupo = todosLosHorarios.find(h => h.id === idGrupo);
    
    if (!horarioGrupo) {
      error.value = 'No se encontró horario para tu grupo';
      return;
    }
    
    // Verificar si está publicado
    if (!horarioGrupo.publicado) {
      horarioPublicado.value = false;
      horarioData.value = null;
      return;
    }
    
    // Horario encontrado y publicado
    horarioData.value = horarioGrupo;
    horarioPublicado.value = true;
    
  } catch (err) {
    console.error('Error al cargar horario:', err);
    error.value = `Error: ${err.message}. Verifica tu conexión e intenta nuevamente.`;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  cargarHorario();
});

// --- FUNCIÓN PARA OBTENER EL ESTILO DE LA CELDA ---
const getCeldaStyle = (dia, hora) => {
  const clase = horarioData.value?.data[dia]?.[hora];
  if (!clase) return {};
  
  const colorMateria = clase.colorMateria || '#AAAAAA';
  const colorGrupo = clase.colorGrupo || '#CCCCCC';
  
  return {
    backgroundColor: colorMateria,
    borderLeft: `5px solid ${colorGrupo}`,
    color: getTextColor(colorMateria)
  };
};

// --- FUNCIÓN PARA DETERMINAR COLOR DE TEXTO ---
const getTextColor = (bgColor) => {
  if (!bgColor || bgColor === 'transparent') return '#000000';
  
  const color = bgColor.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// --- LEYENDA DE MATERIAS ---
const leyendaMaterias = computed(() => {
  if (!horarioData.value) return [];
  
  const materiasMap = new Map();
  
  Object.values(horarioData.value.data).forEach(dia => {
    Object.values(dia).forEach(clase => {
      if (clase && clase.materia && clase.colorMateria) {
        materiasMap.set(clase.materia, {
          nombre: clase.materia,
          color: clase.colorMateria
        });
      }
    });
  });
  
  return Array.from(materiasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
});

// --- FORMATEAR RANGO DE HORA ---
const formatTimeRange = (startHour) => {
  if (!startHour || !startHour.includes(':')) return startHour;
  const [h, m] = startHour.split(':').map(Number);
  const end = h * 60 + m + 60;
  const eh = String(Math.floor(end / 60) % 24).padStart(2, '0');
  const em = String(end % 60).padStart(2, '0');
  return `${startHour} - ${eh}:${em}`;
};

// --- GENERAR PDF ---
const generarPDFIndividual = async () => {
  const el = document.querySelector('.horario-card');
  if (!el) return;
  
  // Ocultar el botón temporalmente
  const btn = el.querySelector('.btn-danger');
  if (btn) btn.style.display = 'none';
  
  const canvas = await html2canvas(el, { scale: 2 });
  
  // Mostrar el botón nuevamente
  if (btn) btn.style.display = 'block';
  
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  
  const w = pageWidth - (margin * 2);
  const h = (canvas.height * w) / canvas.width;
  
  let finalW = w;
  let finalH = h;
  
  if (h > pageHeight - (margin * 2)) {
    finalH = pageHeight - (margin * 2);
    finalW = (canvas.width * finalH) / canvas.height;
  }
  
  const x = (pageWidth - finalW) / 2;
  const y = (pageHeight - finalH) / 2;
  
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, finalW, finalH);
  
  const nombreLimpio = horarioData.value.nombre.replace(/\s/g, '_').replace(/[^\w]/g, '');
  pdf.save(`Mi_Horario_${nombreLimpio}_${periodoCuatrimestral.value}.pdf`);
};
</script>