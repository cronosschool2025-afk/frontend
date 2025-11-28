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
  <h1>Lista de Alumnos</h1>

  <div v-if="cargando" class="loading-container">
    <div class="spinner"></div>
    <p>Cargando información...</p>
  </div>

  <div class="table-container" v-else-if="alumnos.length > 0">
    <table class="styled-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Grupo</th>
          <th>Matrícula</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="alumno in currentAlumnos" :key="alumno.id_estudiante">
          <td :data-label="'Nombre'">{{ alumno.nombre }}</td>
          <td :data-label="'Correo'">{{ alumno.correo }}</td>
          <td :data-label="'Grupo'">{{ obtenerNombreGrupo(alumno.id_grupo) }}</td>
          <td :data-label="'Matrícula'">{{ alumno.matricula }}</td>
          <td :data-label="'Acciones'">
            <button class="btn-secondary btn-accion" @click="editarAlumno(alumno)">Editar</button>
            <button class="btn-danger btn-accion" @click="eliminarAlumno(alumno.id_estudiante)">Eliminar</button>
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

  <!-- Mensaje de vacío solo si NO hay alumnos y ya terminó de cargar -->
  <div v-else class="empty-state">
    <div class="empty-content">
      <h3>No hay alumnos registrados</h3>
      <p>Comienza agregando tu primer alumno al sistema</p>
    </div>
  </div>

  <!-- Botón para agregar nuevo alumno -->
  <div class="btn-div">
    <button class="btn-primary" @click="abrirFormularioNuevo">
      Agregar
    </button>
  </div>

  <!-- Modal del formulario -->
  <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
    <div class="form-container">
      <h2>{{ modoEdicion ? 'Editar Alumno' : 'Agregar Alumno' }}</h2>
      <form @submit.prevent="guardarAlumno">
        <label for="nombre">Nombre:</label>
        <input 
          id="nombre"
          v-model="formAlumno.nombre" 
          type="text" 
          placeholder="Nombre" 
          required 
        />
        
        <label for="apellido_p">Apellido Paterno:</label>
        <input 
          id="apellido_p"
          v-model="formAlumno.apellido_paterno" 
          type="text" 
          placeholder="Apellido Paterno" 
          required 
        />
        
        <label for="apellido_m">Apellido Materno:</label>
        <input 
          id="apellido_m"
          v-model="formAlumno.apellido_materno" 
          type="text" 
          placeholder="Apellido Materno" 
        />
        
        <label for="correo">Correo Electrónico:</label>
        <input 
          id="correo"
          v-model="formAlumno.correo_electronico" 
          type="email" 
          placeholder="Correo" 
          required 
        />
        
        <label for="grupo">Grupo:</label>
        <select id="grupo" v-model="formAlumno.id_grupo" required>
          <option disabled value="">Selecciona un grupo</option>
          <option v-for="g in grupos" :key="g.id" :value="g.id">
            {{ g.nombre }}
          </option>
        </select>
        
        <label for="matricula">Matrícula:</label>
        <input 
          id="matricula"
          v-model="formAlumno.matricula" 
          type="text" 
          placeholder="Matrícula" 
          required 
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
import axios from 'axios'
import '../../assets/styles.css'
import Swal from 'sweetalert2'

const BASE_URL = `https://backend-production-04cf.up.railway.app`

const API_ALUMNOS = `${BASE_URL}/estudiantes`
const API_GRUPOS = `${BASE_URL}/grupos`


const alumnos = ref([])
const grupos = ref([])
const itemsPerPage = 5
const currentPage = ref(1)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const alumnoEditando = ref(null)

const formAlumno = ref({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  correo_electronico: '',
  id_grupo: '',
  matricula: '',
})

const totalPages = computed(() => Math.ceil(alumnos.value.length / itemsPerPage))
const indexOfLastAlumno = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstAlumno = computed(() => indexOfLastAlumno.value - itemsPerPage)
const currentAlumnos = computed(() => alumnos.value.slice(indexOfFirstAlumno.value, indexOfLastAlumno.value))
const handlePageChange = (pageNumber) => (currentPage.value = pageNumber)

const cargando = ref(false) 
const cargandoAccion = ref(false)

const obtenerAlumnos = async () => {
  cargando.value = true 
  try {
    const res = await axios.get(API_ALUMNOS)
    alumnos.value = res.data
  } catch (err) {
    console.error('Error al obtener alumnos:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los alumnos',
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

const obtenerGrupos = async () => {
  try {
    const res = await axios.get(API_GRUPOS)
    grupos.value = res.data
  } catch (err) {
    console.error('Error al obtener grupos:', err)
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
  }
}

const obtenerNombreGrupo = (id) => {
  const grupo = grupos.value.find((g) => g.id === id)
  return grupo ? grupo.nombre : 'Sin grupo'
}

const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  alumnoEditando.value = null
  formAlumno.value = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo_electronico: '',
    id_grupo: '',
    matricula: '',
  }
  mostrarFormulario.value = true
}

const editarAlumno = (alumno) => {
  modoEdicion.value = true
  alumnoEditando.value = alumno.id_estudiante
  const partesNombre = alumno.nombre.split(' ')
  formAlumno.value = {
    nombre: partesNombre[0] || '',
    apellido_paterno: partesNombre[1] || '',
    apellido_materno: partesNombre[2] || '',
    correo_electronico: alumno.correo || '',
    id_grupo: alumno.id_grupo || '',
    matricula: alumno.matricula || '',
  }
  mostrarFormulario.value = true
}

const guardarAlumno = async () => {
  cargandoAccion.value = true
  try {
    if (modoEdicion.value) {
      await axios.patch(`${API_ALUMNOS}/${alumnoEditando.value}`, formAlumno.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Alumno actualizado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_ALUMNOS, formAlumno.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: 'Alumno agregado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    }
    cerrarFormulario()
    await obtenerAlumnos()
  } catch (err) {
    cargandoAccion.value = false
    console.error('Error guardando alumno:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.message || 'Error guardando alumno',
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

const eliminarAlumno = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar alumno?',
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
      await axios.delete(`${API_ALUMNOS}/${id}`)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Alumno eliminado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerAlumnos()
    } catch (err) {
      cargandoAccion.value = false
      console.error('Error al eliminar alumno:', err)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el alumno',
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
  alumnoEditando.value = null
}

onMounted(() => {
  obtenerAlumnos()
  obtenerGrupos()
})
</script>
