<template>
  <div>
    <nav class="nav">
      <div class="nav-container">
        <router-link to="/dashboard" class="nav-figure">
          <img src="../../imagenes/logo.png" class="nav-logo" alt="Logo Cronos" />
        </router-link>
        <label class="nav-toggle" for="menu-input">
          <input type="checkbox" id="menu-input" class="nav-input" />
        </label>
        <ul class="nav-list">
        <li class="nav-item"><router-link to="/dashboard" class="nav-link">Panel de control</router-link></li>
          <li class="nav-item"><router-link :to="{ name: 'perfil-admin' }" class="nav-link">Perfil</router-link>
          </li>
        </ul>
      </div>
    </nav>

    <main class="main-content">
      <h1>Gestión de Horarios</h1>

      <div class="horarios-multi-container">
        
        <!-- HEADER CON CONTROLES -->
        <div class="page-header-container">
          <div class="header-actions">
            <button 
              @click="generarHorarios" 
              :disabled="isLoading"
              class="btn-primary"
            >
              <span v-if="isLoading">Procesando...</span>
              <span v-else>Generar Nuevos Horarios</span>
            </button>
          
            <!-- NUEVO: Botón publicar/despublicar todos -->
            <button 
              @click="togglePublicarTodos" 
              :disabled="!horariosGenerados || isLoading"
              class="btn-success"
            >
              <span v-if="todosPublicados">Dar de baja todos</span>
              <span v-else>Publicar todos</span>
            </button>

            <button 
              @click="generarPDFMasivo" 
              :disabled="datosFiltrados.length === 0 || !horariosGenerados || isLoading"
              class="btn-secondary"
            >
              Descargar Todos (PDF)
            </button>
          </div>
        </div>

        <!-- SELECTOR DE VISTA CON PESTAÑAS -->
        <div class="vista-selector">
          <button
            class="vista-tab"
            :class="{ active: vistaActual === 'grupos' }"
            @click="vistaActual = 'grupos'"
          >
            Grupos
          </button>
          <button
            class="vista-tab"
            :disabled="!horariosGenerados || isLoading"
            :class="{ active: vistaActual === 'profesores' }"
            @click="vistaActual = 'profesores'"
          >
            Profesores
          </button>
        </div>

        <!-- FILTRO DE BÚSQUEDA -->
        <div class="search-container">
          <label class="search-label">Buscar:</label>
          <input
            type="text"
            v-model="searchTerm"
            :placeholder="vistaActual === 'grupos' 
              ? 'Grupo, Tutor, Materia o Profesor...' 
              : 'Profesor, Materia, Aula o Grupo...'"
            class="search-input"
          />
        </div>

        <!-- MENSAJE INICIAL (Sin datos) -->
        <div v-if="!horariosGenerados && !isLoading" class="empty-state">
          <div class="empty-content">
            <h3>No hay horarios generados</h3>
            <p>Haz clic en <strong>"Generar Nuevos Horarios"</strong> para crear los horarios del período.</p>
          </div>
        </div>

        <!-- LOADING -->
        <div v-if="isLoading" class="loading-container">
          <div class="spinner"></div>
          <p>Cargando horarios... Por favor espera.</p>
        </div>

        <!-- ERROR -->
        <div v-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="cargarHorarios" class="btn-primary">Reintentar</button>
        </div>

        <!-- CONTENIDO: HORARIOS -->
        <template v-if="horariosGenerados && !isLoading && !error">
          
          <p v-if="datosFiltrados.length === 0 && searchTerm" class="no-results-text">
            No se encontraron resultados para "{{ searchTerm }}"
          </p>

          <div class="horarios-cards-wrapper">
            <div 
              v-for="item in datosFiltrados" 
              :key="item.id" 
              class="horario-card"
              :class="{ 'horario-publicado': item.publicado }"
              :id="`horario-card-${item.id}`"
            >
              <!-- HEADER DE LA TARJETA -->
              <div class="horario-header">
                <div class="horario-info">
                  <p class="school-info">
                    <b>{{ nombreEscuela }}</b> | Período: <b>{{ periodoCuatrimestral }}</b>
                  </p>
                  <h2 v-if="vistaActual === 'grupos'" class="horario-title">
                    Grupo: {{ item.nombre }}
                  </h2>
                  <h2 v-else class="horario-title">Profesor: {{ item.nombre }}</h2>
                  
                  <p class="tutor-info" v-if="vistaActual === 'grupos'">
                    Tutor: <b>{{ item.tutor }}</b>
                  </p>
                  <p class="division-info">{{ divisionUniforme }}</p>
                </div>
                
                <div class="horario-actions">
                  <button 
                    @click="generarPDFIndividual(item.id, item.nombre)" 
                    class="btn-danger btn-accion"
                    :id="`btn-pdf-${item.id}`"
                  >
                    PDF
                  </button>

                  <!-- NUEVO: Botón publicar individual (solo para grupos) -->
                  <button 
                    v-if="vistaActual === 'grupos'"
                    @click="togglePublicarGrupo(item.id, item.publicado)" 
                    class="btn-accion"
                    :class="item.publicado ? 'btn-warning' : 'btn-success'"
                    :id="`btn-publicar-${item.id}`"
                  >
                    <span v-if="item.publicado">Dar de baja</span>
                    <span v-else>Publicar</span>
                  </button>
                </div>
              </div>

              <!-- LEYENDA DE COLORES INDIVIDUAL -->
              <div class="leyenda-colores-individual">
                <h4 class="leyenda-titulo-individual">
                  {{ vistaActual === 'grupos' ? 'Materias:' : 'Grupos:' }}
                </h4>
                <div class="leyenda-items-individual">
                  <div 
                    v-for="leyendaItem in getLeyendaIndividual(item)" 
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
                        :style="getCeldaStyle(item, dia, hora)"
                      >
                        <!-- VISTA GRUPOS -->
                        <template v-if="vistaActual === 'grupos'">
                          <template v-if="item.data[dia] && item.data[dia][hora]">
                            <div class="clase-content">
                              <div class="clase-materia">{{ item.data[dia][hora].materia }}</div>
                              <div class="clase-profesor">{{ item.data[dia][hora].profesor.split(' ')[0] }}</div>
                              <div class="clase-aula">{{ item.data[dia][hora].aula }} - {{ item.data[dia][hora].edificio }}</div>
                            </div>
                          </template>
                          <template v-else>
                            <div class="clase-empty"></div>
                          </template>
                        </template>

                        <!-- VISTA PROFESORES -->
                        <template v-else>
                          <template v-if="item.data[dia] && item.data[dia][hora]">
                            <div 
                              v-for="(clase, idx) in item.data[dia][hora]" 
                              :key="idx" 
                              class="clase-content"
                              :class="{ 'clase-multiple': idx > 0 }"
                            >
                              <div class="clase-materia">{{ clase.materia }}</div>
                              <div class="clase-grupo">{{ clase.grupo }}</div>
                              <div class="clase-aula">{{ clase.aula }}</div>
                            </div>
                          </template>
                          <template v-else>
                            <div class="clase-empty"></div>
                          </template>
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
const vistaActual = ref('grupos');
const searchTerm = ref('');
const isLoading = ref(false);
const error = ref(null);
const horariosGenerados = ref(false);
const horariosGruposData = ref([]);

// --- Obtener la IP/host actual dinámicamente ---
const HOST = window.location.hostname;

// --- URLs de las APIs ---
const PYTHON_API = `https://algoritmo-production.up.railway.app`;
const NESTJS_API = `https://backend-production-04cf.up.railway.app`;


// --- COMPUTED: Verificar si todos están publicados ---
const todosPublicados = computed(() => {
  if (!horariosGruposData.value.length) return false;
  return horariosGruposData.value.every(grupo => grupo.publicado === true);
});

// --- FUNCIÓN PARA PUBLICAR/DESPUBLICAR TODOS LOS HORARIOS ---
const togglePublicarTodos = async () => {
  const nuevoEstado = !todosPublicados.value;
  
  try {
    const response = await fetch(`${NESTJS_API}/horario-profesor-asignatura/publicar-todos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicado: nuevoEstado })
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el estado de publicación');
    }

    // Actualizar el estado local
    horariosGruposData.value = horariosGruposData.value.map(grupo => ({
      ...grupo,
      publicado: nuevoEstado
    }));

  } catch (err) {
    console.error('Error:', err);
  }
};

// --- FUNCIÓN PARA PUBLICAR/DESPUBLICAR UN GRUPO ---
const togglePublicarGrupo = async (id_grupo, estadoActual) => {
  const nuevoEstado = !estadoActual;
  
  const btn = document.getElementById(`btn-publicar-${id_grupo}`);
  if (btn) btn.disabled = true;

  try {
    const response = await fetch(
      `${NESTJS_API}/horario-profesor-asignatura/grupo/${id_grupo}/publicar`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicado: nuevoEstado })
      }
    );

    if (!response.ok) {
      throw new Error('Error al actualizar el estado de publicación');
    }

    // Actualizar el estado local
    const index = horariosGruposData.value.findIndex(g => g.id === id_grupo);
    if (index !== -1) {
      horariosGruposData.value[index].publicado = nuevoEstado;
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (btn) btn.disabled = false;
  }
};

// --- FUNCIÓN PARA OBTENER EL ESTILO DE LA CELDA CON COLORES ---
const getCeldaStyle = (item, dia, hora) => {
  const clase = item.data[dia]?.[hora];
  if (!clase) return {};
  
  // Para vista de grupos: color principal = materia
  if (vistaActual.value === 'grupos') {
    const colorMateria = clase.colorMateria || '#AAAAAA';
    const colorGrupo = clase.colorGrupo || '#CCCCCC';
    
    return {
      backgroundColor: colorMateria,
      borderLeft: `5px solid ${colorGrupo}`,
      color: getTextColor(colorMateria)
    };
  }
  
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

// --- FUNCIÓN PARA OBTENER LEYENDA INDIVIDUAL DE CADA HORARIO ---
const getLeyendaIndividual = (item) => {
  const itemsMap = new Map();
  
  if (vistaActual.value === 'grupos') {
    // Recopilar materias únicas de este grupo específico
    Object.values(item.data).forEach(dia => {
      Object.values(dia).forEach(clase => {
        if (clase && clase.materia && clase.colorMateria) {
          itemsMap.set(clase.materia, {
            nombre: clase.materia,
            color: clase.colorMateria
          });
        }
      });
    });
  } else {
    // Recopilar grupos únicos de este profesor específico
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
  }
  
  return Array.from(itemsMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
};

// --- GENERAR HORARIOS ---
const generarHorarios = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    console.log('Llamando a Python para generar horarios...');
    const generateResponse = await fetch(`${PYTHON_API}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (!generateResponse.ok) {
      throw new Error(`Error en Python API: ${generateResponse.status}`);
    }
    
    const pythonResult = await generateResponse.json();
    console.log('Python respondió:', pythonResult);
    
    console.log('Obteniendo horarios desde NestJS...');
    const horariosResponse = await fetch(`${NESTJS_API}/horario-profesor-asignatura/grupos/formateados`);
    
    if (!horariosResponse.ok) {
      throw new Error(`Error en NestJS API: ${horariosResponse.status}`);
    }
    
    const data = await horariosResponse.json();
    console.log('Horarios obtenidos:', data);
    
    horariosGruposData.value = data;
    
    if (horariosGruposData.value.length > 0) {
      horariosGenerados.value = true;
    } else {
      error.value = 'No se generaron horarios. Verifica que existan datos en la base de datos.';
    }
  } catch (err) {
    console.error('Error:', err);
    error.value = `Error: ${err.message}. Verifica que ambos servidores estén corriendo (Python: 8000, NestJS: 3000)`;
  } finally {
    isLoading.value = false;
  }
};

// --- CARGAR HORARIOS ---
const cargarHorarios = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    console.log('Cargando horarios existentes desde NestJS...');
    const response = await fetch(`${NESTJS_API}/horario-profesor-asignatura/grupos/formateados`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Horarios cargados:', data);
    
    horariosGruposData.value = data;
    
    if (horariosGruposData.value.length > 0) {
      horariosGenerados.value = true;
    }
  } catch (err) {
    console.error('Error al cargar:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  cargarHorarios();
});

// --- TRANSFORMAR DATOS PARA VISTA PROFESORES ---
const horariosProfesores = computed(() => {
  const map = new Map();
  
  horariosGruposData.value.forEach(grupo => {
    Object.keys(grupo.data).forEach(dia => {
      Object.keys(grupo.data[dia]).forEach(hora => {
        const clase = grupo.data[dia][hora];
        if (!clase) return;
        
        const clases = Array.isArray(clase) ? clase : [clase];
        
        clases.forEach(c => {
          const nombre = c.profesor;
          
          if (!map.has(nombre)) {
            map.set(nombre, {
              nombre,
              id: nombre.replace(/\s/g, '_').replace(/[^\w]/g, ''),
              data: {}
            });
          }
          
          const prof = map.get(nombre);
          if (!prof.data[dia]) prof.data[dia] = {};
          if (!prof.data[dia][hora]) prof.data[dia][hora] = [];
          
          prof.data[dia][hora].push({
            materia: c.materia,
            aula: c.aula,
            grupo: grupo.nombre,
            colorMateria: c.colorMateria,
            colorGrupo: c.colorGrupo
          });
        });
      });
    });
  });
  
  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
});

const datosActuales = computed(() => {
  return vistaActual.value === 'grupos' ? horariosGruposData.value : horariosProfesores.value;
});

const datosFiltrados = computed(() => {
  if (!searchTerm.value.trim()) return datosActuales.value;
  
  const q = searchTerm.value.toLowerCase().trim();
  
  return datosActuales.value.filter(item => {
    if (item.nombre.toLowerCase().includes(q)) return true;
    if (item.tutor?.toLowerCase().includes(q)) return true;
    
    for (const dia of Object.values(item.data)) {
      for (const hora in dia) {
        const clases = Array.isArray(dia[hora]) ? dia[hora] : [dia[hora]];
        if (clases.some(c => 
          c?.materia?.toLowerCase().includes(q) ||
          c?.profesor?.toLowerCase().includes(q) ||
          c?.aula?.toLowerCase().includes(q) ||
          c?.grupo?.toLowerCase().includes(q)
        )) return true;
      }
    }
    return false;
  });
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
  const btnPublicar = document.getElementById(`btn-publicar-${id}`);
  
  if (btn) btn.style.display = 'none';
  if (btnPublicar) btnPublicar.style.display = 'none';
  
  const canvas = await html2canvas(el, { scale: 2 });
  
  if (btn) btn.style.display = 'block';
  if (btnPublicar) btnPublicar.style.display = 'block';
  
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  
  const w = pageWidth - (margin * 2);
  const h = (canvas.height * w) / canvas.width;
  
  // Si la imagen es muy alta, ajustarla para que quepa en la página
  let finalW = w;
  let finalH = h;
  
  if (h > pageHeight - (margin * 2)) {
    finalH = pageHeight - (margin * 2);
    finalW = (canvas.width * finalH) / canvas.height;
  }
  
  const x = (pageWidth - finalW) / 2;
  const y = (pageHeight - finalH) / 2;
  
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, finalW, finalH);
  
  const tipo = vistaActual.value === 'grupos' ? 'Grupo' : 'Profesor';
  const nombreLimpio = nombre.replace(/\s/g, '_').replace(/[^\w]/g, '');
  pdf.save(`Horario_${tipo}-${nombreLimpio}_${periodoCuatrimestral.value}.pdf`);
};

const generarPDFMasivo = async () => {
  if (!datosFiltrados.value.length) return;
  
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const maxH = pageHeight - (margin * 2);
  let y = margin;
  let firstPage = true;
  
  document.querySelectorAll('.btn-danger, .btn-accion').forEach(b => b.style.display = 'none');
  
  for (const item of datosFiltrados.value) {
    const el = document.getElementById(`horario-card-${item.id}`);
    if (!el) continue;
    
    const canvas = await html2canvas(el, { scale: 2 });
    let w = pageWidth - (margin * 2);
    let h = (canvas.height * w) / canvas.width;
    
    // Ajustar si es muy alto
    if (h > maxH) {
      h = maxH;
      w = (canvas.width * h) / canvas.height;
    }
    
    const x = (pageWidth - w) / 2;
    
    if (!firstPage || y + h > maxH) {
      pdf.addPage();
      y = margin;
    }
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h);
    y += h + 15;
    firstPage = false;
  }
  
  document.querySelectorAll('.btn-danger, .btn-accion').forEach(b => b.style.display = 'block');
  
  const tipo = vistaActual.value === 'grupos' ? 'Grupos' : 'Profesores';
  pdf.save(`Horarios_${tipo}_${periodoCuatrimestral.value}.pdf`);
};
</script>