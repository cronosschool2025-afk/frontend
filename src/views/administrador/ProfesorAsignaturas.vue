<template>
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
        <li class="nav-item"><router-link :to="{ name: 'perfil-admin' }" class="nav-link">Perfil</router-link></li>
      </ul>
    </div>
  </nav>

  <div v-if="cargandoAccion" class="action-loading">
    <div class="spinner"></div>
    <p>Procesando...</p>
  </div>

  <main class="main-content">
    <h1>Asignación de Profesores</h1>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <div class="table-container" v-else-if="asignaciones.length > 0">
      <table class="styled-table tabla-compacta">
        <thead>
          <tr>
            <th class="col-nombre-p">Profesor</th>
            <th class="col-asig">Asignatura</th>
            <th class="col-div">División</th>
            <th class="col-aul">Aula</th>
            <th class="col-edi">Edificio</th>
            <th class="col-per">Periodo</th>
            <th class="col-gru">Grupos</th>
            <th class="col-acc">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asig in currentAsignaciones" :key="'asig-' + asig.id">
            <td :data-label="'Profesor'">{{ asig.nombreProfesor }}</td>
            <td :data-label="'Asignatura'">{{ asig.asignatura || '-' }}</td>
            <td :data-label="'División'">{{ asig.division || '-' }}</td>
            <td :data-label="'Aula'">{{ asig.aula || '-' }}</td>
            <td :data-label="'Edificio'">{{ asig.edificio || '-' }}</td>
            <td :data-label="'Periodo'">{{ asig.periodo || '-' }}</td>
            <td :data-label="'Grupos'">{{ asig.grupos || '-' }}</td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarAsignacion(asig)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarAsignacion(asig.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button
          v-for="pageNumber in totalPages"
          :key="pageNumber"
          @click="currentPage = pageNumber"
          :class="{ active: pageNumber === currentPage }"
        >
          {{ pageNumber }}
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-content">
        <h3>No hay asignaciones registradas</h3>
        <p>Comienza asignando profesores a asignaturas</p>
      </div>
    </div>

    <div class="btn-div">
      <button class="btn-primary" @click="abrirFormularioNuevo">
        Agregar
      </button>
    </div>

    <!-- MODAL FORMULARIO -->
    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-container">
        <h2>{{ modoEdicion ? 'Editar Asignación' : 'Agregar Asignación' }}</h2>
        <form @submit.prevent="guardarAsignacion">
          
          <label for="profesor">Profesor:</label>
          <select id="profesor" v-model="form.id_profesor" required>
            <option disabled value="">Selecciona un profesor</option>
            <option v-for="prof in profesores" :key="prof.id" :value="prof.id">
              {{ prof.usuario?.nombre }} {{ prof.usuario?.apellido_paterno }}
            </option>
          </select>

          <label for="asignatura">Asignatura:</label>
          <select id="asignatura" v-model="form.id_asignatura" required>
            <option disabled value="">Selecciona una asignatura</option>
            <option v-for="asig in asignaturas" :key="asig.id" :value="asig.id">
              {{ asig.nombre }} - {{ asig.division?.nombre }}
            </option>
          </select>

          <label for="aula">Aula (opcional):</label>
          <select id="aula" v-model="form.id_aula">
            <option value="">Sin aula</option>
            <option v-for="aula in aulas" :key="aula.id" :value="aula.id">
              {{ aula.nombre }} - {{ aula.edificio?.nombre || 'Sin edificio' }}
            </option>
          </select>

          <label for="periodo">Periodo:</label>
          <select id="periodo" v-model="form.id_periodo" required>
            <option disabled value="">Selecciona un periodo</option>
            <option v-for="per in periodos" :key="per.id" :value="per.id">
              {{ per.nombre }}
            </option>
          </select>

          <label for="grupos">Grupos (múltiples):</label>
          <div class="checkbox-group">
            <div v-for="grupo in grupos" :key="grupo.id" class="checkbox-item">
              <input 
                type="checkbox" 
                :id="'grupo-' + grupo.id"
                :value="grupo.id"
                v-model="form.id_grupos"
              />
              <label :for="'grupo-' + grupo.id">{{ grupo.nombre }}</label>
            </div>
          </div>

          <div class="form-buttons">
            <button type="button" class="btn-secondary" @click="cerrarFormulario">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import '../../assets/styles.css'
import Swal from 'sweetalert2'


const API_ASIGNACIONES = `https://backend-production-04cf.up.railway.app/profesor-asignatura`
const API_ASIGNACIONES_AULAS = `https://backend-production-04cf.up.railway.app/profesor-aula`
const API_PROFESORES = `https://backend-production-04cf.up.railway.app/profesores`
const API_ASIGNATURAS = `https://backend-production-04cf.up.railway.app/asignaturas`
const API_PERIODOS = `https://backend-production-04cf.up.railway.app/periodos`
const API_GRUPOS = `https://backend-production-04cf.up.railway.app/grupos`
const API_AULAS = `https://backend-production-04cf.up.railway.app/aulas`


// Estados
const asignaciones = ref([])

// Catálogos
const profesores = ref([])
const asignaturas = ref([])
const periodos = ref([])
const grupos = ref([])
const aulas = ref([])

// Paginación
const itemsPerPage = 3
const currentPage = ref(1)

// Formulario
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const itemEditando = ref(null)

const cargando = ref(false)
const cargandoAccion = ref(false)

const form = ref({
  id_profesor: '',
  id_asignatura: '',
  id_aula: '',
  id_periodo: '',
  id_grupos: []
})

const totalPages = computed(() => Math.ceil(asignaciones.value.length / itemsPerPage))
const indexOfLast = computed(() => currentPage.value * itemsPerPage)
const indexOfFirst = computed(() => indexOfLast.value - itemsPerPage)
const currentAsignaciones = computed(() => 
  asignaciones.value.slice(indexOfFirst.value, indexOfLast.value)
)

// ============ FUNCIONES DE CARGA ============
const cargarCatalogos = async () => {
  try {
    const [profRes, asigRes, perRes, gruposRes, aulasRes] = await Promise.all([
      axios.get(API_PROFESORES),
      axios.get(API_ASIGNATURAS),
      axios.get(API_PERIODOS),
      axios.get(API_GRUPOS),
      axios.get(API_AULAS)
    ])
    profesores.value = profRes.data
    asignaturas.value = asigRes.data
    periodos.value = perRes.data
    grupos.value = gruposRes.data
    aulas.value = aulasRes.data
  } catch (err) {
    console.error('Error cargando catálogos:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los catálogos',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  }
}

const cargarAsignaciones = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_ASIGNACIONES)
    const aulasRes = await axios.get(API_ASIGNACIONES_AULAS)
    const aulasAsignadas = aulasRes.data
    
    const asignacionesConAulas = res.data.map(asig => {
      const aulaAsignada = aulasAsignadas.find(
        a => a.id_profesor === asig.id_profesor &&
             a.id_periodo === asig.id_periodo
      )

      return {
        id: asig.id,
        nombreProfesor: asig.profesor?.usuario 
          ? `${asig.profesor.usuario.nombre} ${asig.profesor.usuario.apellido_paterno}`
          : 'N/A',
        asignatura: asig.asignatura?.nombre || '-',
        division: asig.asignatura?.division?.nombre || '-',
        aula: aulaAsignada?.aula?.nombre || '-',
        edificio: aulaAsignada?.aula?.edificio?.nombre || '-',
        periodo: asig.periodo?.nombre || '-',
        grupos: asig.gruposAsignados?.length > 0
          ? asig.gruposAsignados.map(ga => ga.grupo?.nombre).filter(Boolean).join(', ')
          : '-',
        datosOriginales: asig
      }
    })
    
    asignaciones.value = asignacionesConAulas
  } catch (err) {
    console.error('Error cargando asignaciones:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las asignaciones',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  } finally {
    cargando.value = false
  }
}

// ============ FORMULARIO ============
const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  itemEditando.value = null
  form.value = {
    id_profesor: '',
    id_asignatura: '',
    id_aula: '',
    id_periodo: '',
    id_grupos: []
  }
  mostrarFormulario.value = true
}

const editarAsignacion = async (asig) => {
  modoEdicion.value = true
  itemEditando.value = asig.id
  
  // Buscar el aula asignada si existe
  let idAula = ''
  try {
    const aulasRes = await axios.get(API_ASIGNACIONES_AULAS)
    const aulaAsignada = aulasRes.data.find(
      a => a.id_profesor === asig.datosOriginales.id_profesor && 
           a.id_periodo === asig.datosOriginales.id_periodo
    )
    if (aulaAsignada) {
      idAula = aulaAsignada.id_aula
    }
  } catch (err) {
    console.error('Error buscando aula:', err)
  }

  form.value = {
    id_profesor: asig.datosOriginales.id_profesor,
    id_asignatura: asig.datosOriginales.id_asignatura,
    id_aula: idAula,
    id_periodo: asig.datosOriginales.id_periodo,
    id_grupos: asig.datosOriginales.gruposAsignados?.map(ga => ga.id_grupo) || []
  }
  
  mostrarFormulario.value = true
}

const guardarAsignacion = async () => {
  cargandoAccion.value = true
  try {
    const payloadAsignatura = {
      id_profesor: form.value.id_profesor,
      id_asignatura: form.value.id_asignatura,
      id_periodo: form.value.id_periodo,
      id_grupos: form.value.id_grupos
    }

    // Guardar o actualizar asignatura
    if (modoEdicion.value) {
      await axios.patch(`${API_ASIGNACIONES}/${itemEditando.value}`, payloadAsignatura)
    } else {
      await axios.post(API_ASIGNACIONES, payloadAsignatura)
    }

    // Gestionar aula si se seleccionó
    if (form.value.id_aula) {
      const payloadAula = {
        id_profesor: form.value.id_profesor,
        id_aula: form.value.id_aula,
        id_periodo: form.value.id_periodo
      }

      try {
        // Buscar si ya existe asignación de aula para este profesor/periodo
        const aulasRes = await axios.get(API_ASIGNACIONES_AULAS)
        const aulaExistente = aulasRes.data.find(
          a => a.id_profesor === form.value.id_profesor && 
               a.id_periodo === form.value.id_periodo
        )

        if (aulaExistente) {
          // Actualizar aula existente
          await axios.patch(`${API_ASIGNACIONES_AULAS}/${aulaExistente.id}`, payloadAula)
        } else {
          // Crear nueva asignación de aula
          await axios.post(API_ASIGNACIONES_AULAS, payloadAula)
        }
      } catch (err) {
        console.error('Error gestionando aula:', err)
      }
    }

    cargandoAccion.value = false
    await Swal.fire({
      icon: 'success',
      title: modoEdicion.value ? '¡Actualizado!' : '¡Agregado!',
      text: `Asignación ${modoEdicion.value ? 'actualizada' : 'agregada'} correctamente`,
      showConfirmButton: false,
      timer: 2000,
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3ABEF9',
      width: '450px',
    })

    cerrarFormulario()
    await cargarAsignaciones()
  } catch (err) {
    cargandoAccion.value = false
    console.error('Error guardando asignación:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.message || 'Error guardando asignación',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  } finally {
    cargandoAccion.value = false
  }
}

const eliminarAsignacion = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar asignación?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#E54848',
    cancelButtonColor: '#88B7F3',
    background: '#ffffff',
    color: '#213547',
    iconColor: '#E54848',
    width: '500px',
  })

  if (confirm.isConfirmed) {
    cargandoAccion.value = true
    try {
      await axios.delete(`${API_ASIGNACIONES}/${id}`)
      cargandoAccion.value = false
      
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Asignación eliminada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      
      await cargarAsignaciones()
      
      if (currentAsignaciones.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      cargandoAccion.value = false
      console.error('Error eliminando:', err)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la asignación',
        confirmButtonColor: '#3ABEF9',
        background: '#ffffff',
        color: '#213547',
        iconColor: '#E54848',
        width: '450px',
      })
    } finally {
      cargandoAccion.value = false
    }
  }
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  modoEdicion.value = false
  itemEditando.value = null
}

// ============ INIT ============
onMounted(async () => {
  await cargarCatalogos()
  await cargarAsignaciones()
})
</script>

<style scoped>
.checkbox-group {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  background: #f9f9f9;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3ABEF9;
}

.checkbox-item label {
  margin: 0;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
}
</style>