<template>
  <div>
    <nav class="nav">
      <div class="nav-container">
        <router-link to="/profesor" class="nav-figure">
          <img src="../../imagenes/logo.png" class="nav-logo" alt="Logo Cronos" />
        </router-link>

        <label class="nav-toggle" for="menu-input">
          <input type="checkbox" id="menu-input" class="nav-input" />
        </label>

        <ul class="nav-list">
          <li class="nav-item"><router-link to="/profesor" class="nav-link">Inicio</router-link></li>
          <li class="nav-item"><router-link to="/profesor/perfil" class="nav-link">Perfil</router-link></li>
        </ul>
      </div>
    </nav>
    
    <main class="main-content">
      <h1>Mi Horario</h1>

      <div class="horarios-multi-container">
        
        <!-- LOADING -->
        <div v-if="isLoading" class="loading-container">
          <div class="spinner"></div>
          <p>Cargando tu horario... Por favor espera.</p>
        </div>

        <!-- ERROR -->
        <div v-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="cargarHorario" class="btn-primary">Reintentar</button>
        </div>

        <!-- SIN HORARIO PUBLICADO -->
        <div v-if="!horarioProfesor && !isLoading && !error" class="empty-state">
          <div class="empty-content">
            <h3>No hay horario disponible</h3>
            <p>Aún no se ha publicado tu horario. Por favor contacta al administrador.</p>
          </div>
        </div>

        <!-- CONTENIDO: HORARIO DEL PROFESOR -->
        <div v-if="horarioProfesor && !isLoading && !error" class="horarios-cards-wrapper">
          <div 
            class="horario-card horario-publicado"
            :id="`horario-card-${horarioProfesor.id}`"
          >
            <!-- HEADER DE LA TARJETA -->
            <div class="horario-header">
              <div class="horario-info">
                <p class="school-info">
                  <b>{{ nombreEscuela }}</b> | Período: <b>{{ periodoCuatrimestral }}</b>
                </p>
                <h2 class="horario-title">Profesor: {{ horarioProfesor.nombre }}</h2>
                <p class="division-info">{{ divisionUniforme }}</p>
              </div>
              
              <div class="horario-actions">
                <button 
                  @click="generarPDFIndividual(horarioProfesor.id, horarioProfesor.nombre)" 
                  class="btn-danger btn-accion"
                  :id="`btn-pdf-${horarioProfesor.id}`"
                >
                  Descargar PDF
                </button>
              </div>
            </div>

            <!-- LEYENDA DE COLORES INDIVIDUAL -->
            <div class="leyenda-colores-individual">
              <h4 class="leyenda-titulo-individual">Grupos:</h4>
              <div class="leyenda-items-individual">
                <div 
                  v-for="leyendaItem in getLeyendaIndividual(horarioProfesor)" 
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
                      :style="getCeldaStyle(horarioProfesor, dia, hora)"
                    >
                      <template v-if="horarioProfesor.data[dia] && horarioProfesor.data[dia][hora]">
                        <div 
                          v-for="(clase, idx) in horarioProfesor.data[dia][hora]" 
                          :key="idx" 
                          class="clase-content"
                          :class="{ 'clase-multiple': idx > 0 }"
                        >
                          <div class="clase-materia">{{ clase.materia }}</div>
                          <div class="clase-grupo">{{ clase.grupo }}</div>
                          <div class="clase-aula">{{ clase.aula }} - {{ clase.edificio }}</div>
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

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
const horarioProfesor = ref(null);

// --- URL de la API ---
const HOST = window.location.hostname;
const NESTJS_API = `https://backend-production-04cf.up.railway.app`;


// --- FUNCIÓN PARA OBTENER EL ID DEL PROFESOR DESDE EL LOCAL STORAGE ---
const obtenerIdProfesorDesdeLocalStorage = () => {
  try {
    const idRol = localStorage.getItem('id_rol');
    if (!idRol) {
      throw new Error('No hay id_rol en localStorage');
    }
    
    return parseInt(idRol);
  } catch (err) {
    console.error('Error al obtener id_rol:', err);
    throw new Error('No se pudo obtener el ID del profesor');
  }
};

const idProfesorActual = ref(null);

// --- FUNCIÓN PARA OBTENER EL ESTILO DE LA CELDA CON COLORES ---
const getCeldaStyle = (item, dia, hora) => {
  const clase = item.data[dia]?.[hora];
  if (!clase) return {};
  
  // Para vista de profesores: color principal = grupo
  if (Array.isArray(clase) && clase.length > 0) {
    const primeraClase = clase[0];
    const colorGrupo = primeraClase.colorGrupo || '#88B7F3';
    const colorMateria = primeraClase.colorMateria || '#E8F4F8';
    
    return {
      backgroundColor: colorGrupo,
      borderLeft: `5px solid ${colorMateria}`,
      color: getTextColor(colorGrupo)
    };
  }
  
  return {};
};

// --- FUNCIÓN PARA DETERMINAR SI EL TEXTO DEBE SER CLARO U OSCURO ---
const getTextColor = (bgColor) => {
  if (!bgColor || bgColor === 'transparent') return '#000000';
  
  const color = bgColor.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// --- FUNCIÓN PARA OBTENER LEYENDA INDIVIDUAL ---
const getLeyendaIndividual = (item) => {
  const itemsMap = new Map();
  
  // Recopilar grupos únicos de este profesor
  Object.values(item.data).forEach(dia => {
    Object.values(dia).forEach(clases => {
      if (Array.isArray(clases)) {
        clases.forEach(clase => {
          if (clase && clase.grupo && clase.colorGrupo) {
            itemsMap.set(clase.grupo, {
              nombre: clase.grupo,
              color: clase.colorGrupo
            });
          }
        });
      }
    });
  });
  
  return Array.from(itemsMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
};

// --- CARGAR HORARIO DEL PROFESOR ---
const cargarHorario = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Obtener el ID del profesor desde localStorage
    idProfesorActual.value = obtenerIdProfesorDesdeLocalStorage();
    
    console.log('ID del profesor (id_rol):', idProfesorActual.value);
    
    console.log(`Cargando horario del profesor ${idProfesorActual.value}...`);
    const response = await fetch(
      `${NESTJS_API}/horario-profesor-asignatura/profesor/${idProfesorActual.value}/publicado`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        horarioProfesor.value = null;
        return;
      }
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Horario cargado:', data);
    
    // Transformar datos para que coincidan con el formato esperado
    if (data) {
      horarioProfesor.value = {
        id: data.id,
        nombre: data.nombre,
        data: {}
      };

      // Inicializar días
      dias.value.forEach(dia => {
        horarioProfesor.value.data[dia] = {};
      });

      // Convertir el formato de datos
      Object.keys(data.data).forEach(dia => {
        Object.keys(data.data[dia]).forEach(hora => {
          const clase = data.data[dia][hora];
          // Asegurarse de que sea un array
          horarioProfesor.value.data[dia][hora] = Array.isArray(clase) ? clase : [clase];
        });
      });
    }
    
  } catch (err) {
    console.error('Error al cargar:', err);
    error.value = `Error: ${err.message}. Verifica tu conexión e intenta nuevamente.`;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  cargarHorario();
});

const formatTimeRange = (startHour) => {
  if (!startHour || !startHour.includes(':')) return startHour;
  const [h, m] = startHour.split(':').map(Number);
  const end = h * 60 + m + 60;
  const eh = String(Math.floor(end / 60) % 24).padStart(2, '0');
  const em = String(end % 60).padStart(2, '0');
  return `${startHour} - ${eh}:${em}`;
};

const generarPDFIndividual = async (id, nombre) => {
  const el = document.getElementById(`horario-card-${id}`);
  if (!el) return;
  
  const btn = document.getElementById(`btn-pdf-${id}`);
  if (btn) btn.style.display = 'none';
  
  const canvas = await html2canvas(el, { scale: 2 });
  
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
  
  const nombreLimpio = nombre.replace(/\s/g, '_').replace(/[^\w]/g, '');
  pdf.save(`Mi_Horario_${nombreLimpio}_${periodoCuatrimestral.value}.pdf`);
};
</script>