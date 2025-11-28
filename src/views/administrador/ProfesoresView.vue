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
    <h1 class="h1-x">Lista de Profesores</h1>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <!-- TABLA -->
    <div class="table-container" v-else-if="profesores.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Título</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="profesor in currentProfesores" :key="profesor.id">
            <td :data-label="'Nombre'">
              {{ profesor.usuario?.nombre }} 
              {{ profesor.usuario?.apellido_paterno }} 
              {{ profesor.usuario?.apellido_materno }}
            </td>
            <td :data-label="'Correo'">{{ profesor.usuario?.correo_electronico }}</td>
            <td :data-label="'Teléfono'">{{ profesor.telefono }}</td>
            <td :data-label="'Título'">{{ profesor.titulo }}</td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarProfesor(profesor)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarProfesor(profesor.id)">Eliminar</button>
              <button class="btn-primary btn-accion" @click="verDisponibilidad(profesor)">Disposición</button>
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

    <!-- Mensaje de vacío solo si NO hay profesores y ya terminó de cargar -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <h3>No hay profesores registrados</h3>
        <p>Comienza agregando tu primer profesor al sistema</p>
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
        <h2>{{ modoEdicion ? 'Editar Profesor' : 'Agregar Profesor' }}</h2>
        <form @submit.prevent="guardarProfesor">
          <label for="nombre">Nombre:</label>
          <input 
            id="nombre"
            v-model="formProfesor.nombre" 
            type="text" 
            placeholder="Nombre" 
            required 
          />
          
          <label for="apellido_p">Apellido Paterno:</label>
          <input 
            id="apellido_p"
            v-model="formProfesor.apellido_paterno" 
            type="text" 
            placeholder="Apellido Paterno" 
            required 
          />
          
          <label for="apellido_m">Apellido Materno:</label>
          <input 
            id="apellido_m"
            v-model="formProfesor.apellido_materno" 
            type="text" 
            placeholder="Apellido Materno" 
          />
          
          <label for="correo">Correo Electrónico:</label>
          <input 
            id="correo"
            v-model="formProfesor.correo_electronico" 
            type="email" 
            placeholder="Correo" 
            required 
          />
          
          <label for="telefono">Teléfono:</label>
          <input 
            id="telefono"
            v-model="formProfesor.telefono" 
            type="tel" 
            placeholder="Teléfono (10 dígitos)" 
            maxlength="10"
            pattern="[0-9]{10}"
          />
          
          <label for="titulo">Título:</label>
          <input 
            id="titulo"
            v-model="formProfesor.titulo" 
            type="text" 
            placeholder="Título (ej: Ing., Lic., Dr.)"
            maxlength="100"
          />
          
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
import { useRouter } from 'vue-router'
import axios from 'axios'
import '../../assets/styles.css'
import Swal from 'sweetalert2'

const router = useRouter()

const HOST = window.location.hostname
const API_URL = `http://${HOST}:3000/profesores`

const profesores = ref([])
const itemsPerPage = 5
const currentPage = ref(1)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const profesorEditando = ref(null)

const formProfesor = ref({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  correo_electronico: '',
  telefono: '',
  titulo: '',
})

const totalPages = computed(() => Math.ceil(profesores.value.length / itemsPerPage))
const indexOfLastProfesor = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstProfesor = computed(() => indexOfLastProfesor.value - itemsPerPage)
const currentProfesores = computed(() => profesores.value.slice(indexOfFirstProfesor.value, indexOfLastProfesor.value))

const handlePageChange = (pageNumber) => {
  currentPage.value = pageNumber
}

const cargando = ref(false) 
const cargandoAccion = ref(false)

// Cargar todos los profesores
const obtenerProfesores = async () => {
  cargando.value = true 
  try {
    const res = await axios.get(API_URL)
    profesores.value = res.data
  } catch (err) {
    console.error('Error al obtener profesores:', err)
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
  } finally {
    cargando.value = false 
  }
}

// Abrir formulario para nuevo profesor
const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  profesorEditando.value = null
  formProfesor.value = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo_electronico: '',
    telefono: '',
    titulo: '',
  }
  mostrarFormulario.value = true
}

// Abrir formulario para editar profesor
const editarProfesor = (profesor) => {
  modoEdicion.value = true
  profesorEditando.value = profesor.id
  formProfesor.value = {
    nombre: profesor.usuario?.nombre || '',
    apellido_paterno: profesor.usuario?.apellido_paterno || '',
    apellido_materno: profesor.usuario?.apellido_materno || '',
    correo_electronico: profesor.usuario?.correo_electronico || '',
    telefono: profesor.telefono || '',
    titulo: profesor.titulo || '',
  }
  mostrarFormulario.value = true
}

// Redirigir a la disponibilidad del profesor
const verDisponibilidad = (profesor) => {
  router.push(`/horarios-profesor/${profesor.id}`)
}

// Guardar (crear o actualizar)
const guardarProfesor = async () => {
  cargandoAccion.value = true
  try {
    if (modoEdicion.value) {
      await axios.patch(`${API_URL}/${profesorEditando.value}`, formProfesor.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Profesor actualizado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_URL, formProfesor.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: 'Profesor agregado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    }
    cerrarFormulario()
    await obtenerProfesores()
  } catch (err) {
    cargandoAccion.value = false
    console.error('Error al guardar profesor:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.message || 'Error al guardar profesor',
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

// Cerrar formulario
const cerrarFormulario = () => {
  mostrarFormulario.value = false
  modoEdicion.value = false
  profesorEditando.value = null
}

// Eliminar profesor
const eliminarProfesor = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar profesor?',
    text: 'Esto también eliminará su usuario. Esta acción no se puede deshacer.',
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
        text: 'Profesor eliminado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerProfesores()
      if (currentProfesores.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      cargandoAccion.value = false
      console.error('Error al eliminar profesor:', err)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el profesor',
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

onMounted(() => {
  obtenerProfesores()
})
</script>