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
    <h1 class="h1-x">Lista de Grupos</h1>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <div class="table-container" v-else-if="grupos.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Abreviatura</th>
            <th>Grado</th>
            <th>División</th>
            <th>Turno</th>
            <th>Tutor</th>
            <th>Color</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="grupo in currentGrupos" :key="grupo.id">
            <td :data-label="'Nombre'">{{ grupo.nombre }}</td>
            <td :data-label="'Abreviatura'">{{ grupo.abreviatura }}</td>
            <td :data-label="'Grado'">{{ grupo.grado }}</td>
            <td :data-label="'División'">{{ grupo.division?.nombre || '-' }}</td>
            <td :data-label="'Turno'">{{ grupo.turno?.nombre || '-' }}</td>
            <td :data-label="'Tutor'">{{ grupo.tutor?.usuario?.nombre }} {{ grupo.tutor?.usuario?.apellido_paterno || '' }}</td>
            <td :data-label="'Color'">
              <div
                class="color-box"
                :style="{ backgroundColor: grupo.colorIdentificador }"
              ></div>
            </td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarGrupo(grupo)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarGrupo(grupo.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button
          v-for="pageNumber in totalPages"
          :key="pageNumber"
          @click="handlePageChange(pageNumber)"
          :class="{ active: pageNumber === currentPage }"
        >
          {{ pageNumber }}
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-content">
        <h3>No hay grupos registrados</h3>
        <p>Comienza agregando tu primer grupo al sistema</p>
      </div>
    </div>

    <div class="btn-div">
      <button class="btn-primary" @click="abrirFormularioNuevo">Agregar</button>
    </div>

    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-container">
        <h2>{{ modoEdicion ? 'Editar Grupo' : 'Agregar Grupo' }}</h2>
        <form @submit.prevent="guardarGrupo">
          <label for="nombre">Nombre del grupo:</label>
          <input 
            id="nombre"
            v-model="formGrupo.nombre" 
            type="text"
            placeholder="Nombre del grupo"
            required 
          />
          
          <label for="abreviatura">Abreviatura:</label>
          <input 
            id="abreviatura"
            v-model="formGrupo.abreviatura" 
            type="text" 
            placeholder="Abreviatura" 
            maxlength="10"
          />
          
          <label for="grado">Grado:</label>
          <input 
            id="grado"
            v-model="formGrupo.grado" 
            type="number" 
            placeholder="Grado" 
            required 
          />
          
          <label for="division">División:</label>
          <select 
            id="division" 
            v-model.number="formGrupo.id_division" 
            required
          >
            <option value="" disabled>Seleccione una división</option>
            <option v-for="division in divisiones" :key="division.id" :value="division.id">
              {{ division.nombre }}
            </option>
          </select>

          <label for="turno">Turno:</label>
          <select 
            id="turno"
            v-model.number="formGrupo.id_turno" 
            required
          >
            <option value="" disabled>Seleccione un turno</option>
            <option v-for="turno in turnos" :key="turno.id" :value="turno.id">
              {{ turno.nombre }}
            </option>
          </select>

          <label for="tutor">Tutor:</label>
          <select 
            id="tutor"
            v-model.number="formGrupo.tutor_id" 
            required
          >
            <option value="" disabled>Seleccione un tutor</option>
            <option v-for="profesor in profesores" :key="profesor.id" :value="profesor.id">
              {{ profesor.usuario.nombre }} {{ profesor.usuario.apellido_paterno }}
            </option>
          </select>

          <label for="color-identificador">Color identificador:</label>
          <input
            id="color-identificador"
            v-model="formGrupo.color_identificador"
            type="color"
            class="color-pointer"
          />

          <div class="form-buttons">
            <button type="button" class="btn-secondary" @click="cerrarFormulario">Cancelar</button>
            <button type="submit" class="btn-primary">{{ modoEdicion ? 'Actualizar' : 'Guardar' }}</button>
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

const HOST = window.location.hostname;

const API_GRUPOS = `http://${HOST}:3000/grupos`;
const API_DIVISIONES = `http://${HOST}:3000/divisiones`;
const API_TURNOS = `http://${HOST}:3000/turnos`;
const API_PROFESORES = `http://${HOST}:3000/profesores`;


const grupos = ref([])
const divisiones = ref([])
const turnos = ref([])
const profesores = ref([])

const itemsPerPage = 5
const currentPage = ref(1)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const grupoEditando = ref(null)

const cargando = ref(false)
const cargandoAccion = ref(false)

const formGrupo = ref({
  nombre: '',
  abreviatura: '',
  grado: '',          
  id_division: '',
  id_turno: '',
  tutor_id: '',
  color_identificador: '#3498db'
})

const totalPages = computed(() => Math.ceil(grupos.value.length / itemsPerPage))
const indexOfLastGrupo = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstGrupo = computed(() => indexOfLastGrupo.value - itemsPerPage)
const currentGrupos = computed(() => grupos.value.slice(indexOfFirstGrupo.value, indexOfLastGrupo.value))

const handlePageChange = (pageNumber) => {
  currentPage.value = pageNumber
}

const obtenerGrupos = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_GRUPOS)
    grupos.value = res.data
  } catch (error) {
    console.error('Error al obtener grupos:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los grupos',
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

const obtenerDivisiones = async () => {
  try {
    const res = await axios.get(API_DIVISIONES)
    divisiones.value = res.data
  } catch (error) {
    console.error('Error al obtener divisiones:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las divisiones',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  }
}

const obtenerTurnos = async () => {
  try {
    const res = await axios.get(API_TURNOS)
    turnos.value = res.data
  } catch (error) {
    console.error('Error al obtener turnos:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los turnos',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  }
}

const obtenerProfesores = async () => {
  try {
    const res = await axios.get(API_PROFESORES)
    profesores.value = res.data
  } catch (error) {
    console.error('Error al obtener profesores:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los profesores',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  }
}

const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  grupoEditando.value = null
  formGrupo.value = {
    nombre: '',
    abreviatura: '',
    grado: '',
    id_division: '',
    id_turno: '',
    tutor_id: '',
    color_identificador: '#3498db'
  }
  mostrarFormulario.value = true
}

const editarGrupo = (grupo) => {
  modoEdicion.value = true
  grupoEditando.value = grupo.id

  formGrupo.value = {
    nombre: grupo.nombre || '',
    abreviatura: grupo.abreviatura || '',
    grado: String(grupo.grado || ''), 
    id_division: grupo.id_division || grupo.division?.id || '',
    id_turno: grupo.id_turno || grupo.turno?.id || '',
    tutor_id: grupo.tutor_id || grupo.tutor?.id || '',
    color_identificador: grupo.colorIdentificador || '#3498db'
  }

  mostrarFormulario.value = true
}

const guardarGrupo = async () => {
  cargandoAccion.value = true
  try {
    formGrupo.value.grado = String(formGrupo.value.grado)
    if (modoEdicion.value) {
      await axios.patch(`${API_GRUPOS}/${grupoEditando.value}`, formGrupo.value)
      cargandoAccion.value = false
      await Swal.fire({ 
        icon: 'success', 
        title: '¡Actualizado!', 
        text: 'Grupo actualizado correctamente', 
        showConfirmButton: false, 
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_GRUPOS, formGrupo.value)
      cargandoAccion.value = false
      await Swal.fire({ 
        icon: 'success', 
        title: '¡Agregado!', 
        text: 'Grupo agregado correctamente', 
        showConfirmButton: false, 
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px', 
      })
    }

    cerrarFormulario()
    await obtenerGrupos()

  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar grupo:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'Error al guardar el grupo',
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

const eliminarGrupo = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar grupo?',
    text: 'Esto podría afectar a los alumnos asociados. Esta acción no se puede deshacer.',
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
      await axios.delete(`${API_GRUPOS}/${id}`)
      cargandoAccion.value = false
      await Swal.fire({ 
        icon: 'success', 
        title: 'Eliminado', 
        text: 'Grupo eliminado correctamente', 
        showConfirmButton: false, 
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerGrupos()

      if (currentGrupos.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }

    } catch (error) {
      cargandoAccion.value = false
      console.error('Error al eliminar grupo:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el grupo. Puede estar asociado a otras entidades.',
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
  grupoEditando.value = null
}

onMounted(() => {
  obtenerGrupos()
  obtenerDivisiones()
  obtenerTurnos()
  obtenerProfesores()
})
</script>