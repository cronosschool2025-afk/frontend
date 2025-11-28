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
    <h1 class="h1-x">Lista de Edificios</h1>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <!-- Tabla de edificios -->
    <div class="table-container" v-else-if="edificios.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Abreviatura</th>
            <th>Tipo</th>
            <th>División</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="edificio in currentEdificios" :key="edificio.id">
            <td :data-label="'Nombre'">{{ edificio.nombre }}</td>
            <td :data-label="'Abreviatura'">{{ edificio.abreviatura || '-' }}</td>
            <td :data-label="'Tipo'">
              {{
                edificio.tipo === 'especialidad'
                  ? 'Especialidad'
                  : edificio.tipo === 'tronco_comun'
                  ? 'Tronco común'
                  : '-'
              }}
            </td>
            <td :data-label="'División'">{{ obtenerNombreDivision(edificio.id_division) }}</td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarEdificio(edificio)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarEdificio(edificio.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación -->
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

    <!-- Mensaje vacío -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <h3>No hay edificios registrados</h3>
        <p>Comienza agregando tu primer edificio al sistema</p>
      </div>
    </div>

    <div class="btn-div">
      <button class="btn-primary" @click="abrirFormularioNuevo">
        Agregar
      </button>
    </div>

    <!-- FORMULARIO EMERGENTE -->
    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-container">
        <h2>{{ modoEdicion ? 'Editar Edificio' : 'Agregar Edificio' }}</h2>
        <form @submit.prevent="guardarEdificio">
          <label for="nombre">Nombre del edificio:</label>
          <input
            id="nombre"
            v-model="formEdificio.nombre"
            type="text"
            placeholder="Nombre del edificio"
            required
          />
          
          <label for="abreviatura">Abreviatura:</label>
          <input
            id="abreviatura"
            v-model="formEdificio.abreviatura"
            type="text"
            placeholder="Abreviatura"
            maxlength="10"
          />

          <label for="tipo">Tipo:</label>
          <select 
            id="tipo" 
            v-model="formEdificio.tipo" 
            required
          >
            <option value="" disabled>Selecciona el tipo</option>
            <option value="especialidad">Especialidad</option>
            <option value="tronco_comun">Tronco común</option>
          </select>

          <label for="division">División:</label>
          <select
            id="division"
            v-model.number="formEdificio.id_division"
            required
          >
            <option value="" disabled>Seleccione una división</option>
            <option v-for="division in divisiones" :key="division.id" :value="division.id">
              {{ division.nombre }}
            </option>
          </select>

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

const API_EDIFICIOS = `http://${HOST}:3000/edificios`;
const API_DIVISIONES = `http://${HOST}:3000/divisiones`;


const edificios = ref([])
const divisiones = ref([])
const cargando = ref(false) 
const cargandoAccion = ref(false)
const itemsPerPage = 5
const currentPage = ref(1)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const edificioEditando = ref(null)

const formEdificio = ref({
  nombre: '',
  abreviatura: '',
  tipo: '',
  id_division: ''
})

const totalPages = computed(() => Math.ceil(edificios.value.length / itemsPerPage))
const indexOfLastEdificio = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstEdificio = computed(() => indexOfLastEdificio.value - itemsPerPage)
const currentEdificios = computed(() => 
  edificios.value.slice(indexOfFirstEdificio.value, indexOfLastEdificio.value)
)

const handlePageChange = (pageNumber) => {
  currentPage.value = pageNumber
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

const obtenerEdificios = async () => {
  cargando.value = true
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
  } finally {
    cargando.value = false
  }
}

const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  edificioEditando.value = null
  formEdificio.value = {
    nombre: '',
    abreviatura: '',
    tipo: '',
    id_division: ''
  }
  mostrarFormulario.value = true
}

const editarEdificio = (edificio) => {
  modoEdicion.value = true
  edificioEditando.value = edificio.id
  formEdificio.value = {
    nombre: edificio.nombre || '',
    abreviatura: edificio.abreviatura || '',
    tipo: edificio.tipo || '',
    id_division: edificio.id_division || ''
  }
  mostrarFormulario.value = true
}

const guardarEdificio = async () => {
  cargandoAccion.value = true
  try {
    if (modoEdicion.value) {
      await axios.patch(`${API_EDIFICIOS}/${edificioEditando.value}`, formEdificio.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Edificio actualizado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_EDIFICIOS, formEdificio.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: 'Edificio agregado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    }
    cerrarFormulario()
    await obtenerEdificios()
  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar edificio:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'Error al guardar el edificio',
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

const eliminarEdificio = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar edificio?',
    text: 'Esto podría afectar a las aulas asociadas. Esta acción no se puede deshacer.',
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
      await axios.delete(`${API_EDIFICIOS}/${id}`)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Edificio eliminado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerEdificios()
      if (currentEdificios.value.length === 0 && currentPage.value > 1) currentPage.value--
    } catch (error) {
      cargandoAccion.value = false
      console.error('Error al eliminar edificio:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el edificio. Puede estar asociado a otras entidades.',
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
  edificioEditando.value = null
}

const obtenerNombreDivision = (id_division) => {
  const division = divisiones.value.find(d => d.id === id_division)
  return division ? division.nombre : '-'
}

onMounted(() => {
  obtenerDivisiones()
  obtenerEdificios()
})
</script>
