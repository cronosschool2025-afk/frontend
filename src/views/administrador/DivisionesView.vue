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
    <h1>Lista de Divisiones</h1>

    <!-- Spinner mientras carga -->
    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <!-- Tabla de divisiones -->
    <div class="table-container" v-else-if="divisiones.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Abreviatura</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="division in currentDivisiones" :key="division.id">
            <td :data-label="'Nombre'">{{ division.nombre }}</td>
            <td :data-label="'Abreviatura'">{{ division.abreviatura || '-' }}</td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarDivision(division)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarDivision(division.id)">Eliminar</button>
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

    <!-- Mensaje vacío solo si ya cargó -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <h3>No hay divisiones registradas</h3>
        <p>Comienza agregando tu primera división al sistema</p>
      </div>
    </div>

    <div class="btn-div">
      <button class="btn-primary" @click="abrirFormularioNuevo">
        Agregar
      </button>
    </div>

    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-container">
        <h2>{{ modoEdicion ? 'Editar División' : 'Agregar División' }}</h2>
        <form @submit.prevent="guardarDivision">
          <label for="nombre">Nombre de la división:</label>
          <input
            id="nombre"
            v-model="formDivision.nombre"
            type="text"
            placeholder="Nombre de la división"
            required
          />
          
          <label for="abreviatura">Abreviatura:</label>
          <input
            id="abreviatura"
            v-model="formDivision.abreviatura"
            type="text"
            placeholder="Abreviatura (ej: ING, MED)"
            maxlength="10"
          />
          
          <div class="form-buttons">
            <button type="button" class="btn-secondary" @click="cerrarFormulario">
              Cancelar
            </button>
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

const HOST = window.location.hostname;
const API_URL = `http://${HOST}:3000/divisiones`;


const divisiones = ref([])
const cargando = ref(false)
const cargandoAccion = ref(false)
const itemsPerPage = 5
const currentPage = ref(1)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const divisionEditando = ref(null)

const formDivision = ref({
  nombre: '',
  abreviatura: ''
})

const totalPages = computed(() => Math.ceil(divisiones.value.length / itemsPerPage))
const indexOfLastDivision = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstDivision = computed(() => indexOfLastDivision.value - itemsPerPage)
const currentDivisiones = computed(() => 
  divisiones.value.slice(indexOfFirstDivision.value, indexOfLastDivision.value)
)

const handlePageChange = (pageNumber) => {
  currentPage.value = pageNumber
}

const obtenerDivisiones = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_URL)
    divisiones.value = res.data
    console.log('Divisiones obtenidas:', res.data)
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
  } finally {
    cargando.value = false
  }
}

const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  divisionEditando.value = null
  formDivision.value = {
    nombre: '',
    abreviatura: ''
  }
  mostrarFormulario.value = true
}

const editarDivision = (division) => {
  modoEdicion.value = true
  divisionEditando.value = division.id
  formDivision.value = {
    nombre: division.nombre || '',
    abreviatura: division.abreviatura || ''
  }
  mostrarFormulario.value = true
}

const guardarDivision = async () => {
  cargandoAccion.value = true
  try {
    if (modoEdicion.value) {
      await axios.patch(`${API_URL}/${divisionEditando.value}`, formDivision.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'División actualizada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_URL, formDivision.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: 'División agregada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    }
    cerrarFormulario()
    await obtenerDivisiones()
  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar división:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'Error al guardar la división',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '500px',
    })
  }finally {
    cargandoAccion.value = false
  }
}

const eliminarDivision = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar división?',
    text: 'Esto podría afectar a las materias asociadas. Esta acción no se puede deshacer.',
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
      await axios.delete(`${API_URL}/${id}`)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'División eliminada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerDivisiones()
      
      if (currentDivisiones.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (error) {
      cargandoAccion.value = false
      console.error('Error al eliminar división:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la división. Puede estar asociada a otras entidades.',
        confirmButtonColor: '#3ABEF9',
        background: '#ffffff',
        color: '#213547',
        iconColor: '#E54848',
        width: '500px',
      })
    }finally {
      cargandoAccion.value = false
    }
  }
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  modoEdicion.value = false
  divisionEditando.value = null
}

onMounted(() => {
  obtenerDivisiones()
})
</script>
