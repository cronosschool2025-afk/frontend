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
    <h1>Lista de Aulas</h1>

    <!-- Spinner mientras carga -->
    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <!-- Tabla de aulas si hay datos -->
    <div class="table-container" v-else-if="aulas.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Abreviatura</th> 
            <th>Capacidad</th>
            <th>Ubicación</th>
            <th>Edificio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="aula in currentAulas" :key="aula.id">
            <td :data-label="'Nombre'">{{ aula.nombre }}</td>
            <td :data-label="'Abreviatura'">{{ aula.abreviatura || '-' }}</td> 
            <td :data-label="'Capacidad'">{{ aula.capacidad }}</td>
            <td :data-label="'Ubicación'">{{ aula.ubicacion }}</td>
            <td :data-label="'Edificio'">{{ aula.edificio?.nombre || '-' }}</td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarAula(aula)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarAula(aula.id)">Eliminar</button>
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

    <!-- Mensaje vacío solo si NO hay aulas y ya terminó de cargar -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <h3>No hay aulas registradas</h3>
        <p>Comienza agregando tu primera aula al sistema</p>
      </div>
    </div>

    <div class="btn-div">
      <button class="btn-primary" @click="abrirFormularioNuevo">
        Agregar
      </button>
    </div>

    <!-- FORMULARIO -->
    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-container">
        <h2>{{ modoEdicion ? 'Editar Aula' : 'Agregar Aula' }}</h2>
        <form @submit.prevent="guardarAula">
          <label for="nombre">Nombre del aula:</label>
          <input 
            id="nombre"
            v-model="formAula.nombre" 
            type="text" 
            placeholder="Nombre del aula" 
            required 
          />
          
          <label for="abreviatura">Abreviatura:</label>
          <input 
            id="abreviatura"
            v-model="formAula.abreviatura" 
            type="text" 
            placeholder="Abreviatura (opcional)" 
            maxlength="10" 
          />
          
          <label for="capacidad">Capacidad:</label>
          <input 
            id="capacidad"
            v-model.number="formAula.capacidad" 
            type="number" 
            placeholder="Capacidad" 
            required 
          />
          
          <label for="ubicacion">Ubicación:</label>
          <select
            id="ubicacion"
            v-model="formAula.ubicacion"
            required
          >
            <option value="" disabled>Seleccione ubicación</option>
            <option value="Planta alta">Planta alta</option>
            <option value="Planta baja">Planta baja</option>
          </select>

          <label for="edificio">Edificio:</label>
          <select
            id="edificio"
            v-model.number="formAula.id_edificio"
            required
          >
            <option value="" disabled>Seleccione un edificio</option>
            <option v-for="edificio in edificios" :key="edificio.id" :value="edificio.id">
              {{ edificio.nombre }}
            </option>
          </select>

          <div class="form-buttons">
            <button type="button" class="btn-secondary" @click="cerrarFormulario">Cancelar</button>
            <button type="submit" class="btn-primary">
              {{ modoEdicion ? 'Actualizar' : 'Guardar' }}
            </button>
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

const BASE_URL = `https://backend-production-04cf.up.railway.app`

const API_AULAS = `${BASE_URL}/aulas`
const API_EDIFICIOS = `${BASE_URL}/edificios`

// Variables reactivas
const aulas = ref([])
const edificios = ref([])
const cargando = ref(false)
const cargandoAccion = ref(false)

const itemsPerPage = 5
const currentPage = ref(1)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const aulaEditando = ref(null)

// Formulario reactivo
const formAula = ref({
  nombre: '',
  abreviatura: '',
  capacidad: '',
  ubicacion: '',
  id_edificio: ''
})

// --- Paginación ---
const totalPages = computed(() => Math.ceil(aulas.value.length / itemsPerPage))
const indexOfLastAula = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstAula = computed(() => indexOfLastAula.value - itemsPerPage)
const currentAulas = computed(() => aulas.value.slice(indexOfFirstAula.value, indexOfLastAula.value))

const handlePageChange = (pageNumber) => {
  currentPage.value = pageNumber
}

const obtenerAulas = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_AULAS)
    aulas.value = res.data
  } catch (error) {
    console.error('Error al obtener aulas:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las aulas',
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

const obtenerEdificios = async () => {
  try {
    const res = await axios.get(API_EDIFICIOS)
    edificios.value = res.data
  } catch (error) {
    console.error('Error al obtener edificios:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los edificios',
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
  aulaEditando.value = null
  formAula.value = { 
    nombre: '', 
    abreviatura: '', 
    capacidad: '', 
    ubicacion: '', 
    id_edificio: '' 
  }
  mostrarFormulario.value = true
}

const editarAula = (aula) => {
  modoEdicion.value = true
  aulaEditando.value = aula.id
  formAula.value = {
    nombre: aula.nombre || '',
    abreviatura: aula.abreviatura || '',
    capacidad: aula.capacidad || '',
    ubicacion: aula.ubicacion || '',
    id_edificio: aula.id_edificio || aula.edificio?.id || ''
  }
  mostrarFormulario.value = true
}

const guardarAula = async () => {
  cargandoAccion.value = true
  try {
    if (modoEdicion.value) {
      await axios.patch(`${API_AULAS}/${aulaEditando.value}`, formAula.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Aula actualizada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_AULAS, formAula.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: 'Aula agregada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    }
    cerrarFormulario()
    await obtenerAulas()
  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar aula:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'Error al guardar el aula',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  }finally {
    cargandoAccion.value = false
  }
}

const eliminarAula = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar aula?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#E54848',
    cancelButtonColor: '#88B7F3',
    background: '#ffffff',
    color: '#213547',
    iconColor: '#E54848',
    width: '450px',
  })

  if (confirm.isConfirmed) {
    cargandoAccion.value = true
    try {
      await axios.delete(`${API_AULAS}/${id}`)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Aula eliminada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerAulas()
      if (currentAulas.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (error) {
      console.error('Error al eliminar aula:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el aula',
        confirmButtonColor: '#3ABEF9',
        background: '#ffffff',
        color: '#213547',
        iconColor: '#E54848',
        width: '450px',
      })
    }finally {
      cargandoAccion.value = false
    }
  }
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  modoEdicion.value = false
  aulaEditando.value = null
}

onMounted(() => {
  obtenerAulas()
  obtenerEdificios()
})
</script>
