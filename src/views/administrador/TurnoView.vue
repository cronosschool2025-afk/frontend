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
    <h1 class="h1-x">Lista de Turnos</h1>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <div class="table-container" v-else-if="turnos.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Día Inicio</th>
            <th>Día Fin</th>
            <th>Hora Inicio</th>
            <th>Hora Fin</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="turno in currentTurnos" :key="turno.id">
            <td :data-label="'Nombre'">{{ turno.nombre }}</td>
            <td :data-label="'Día Inicio'">{{ obtenerNombreDia(turno.diaInicio) }}</td>
            <td :data-label="'Día Fin'">{{ obtenerNombreDia(turno.diaFin) }}</td>
            <td :data-label="'Hora Inicio'">{{ turno.horaInicio }}</td>
            <td :data-label="'Hora Fin'">{{ turno.horaFin }}</td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarTurno(turno)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarTurno(turno.id)">Eliminar</button>
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
        <h3>No hay turnos registrados</h3>
        <p>Comienza agregando tu primer turno al sistema</p>
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
        <h2>{{ modoEdicion ? 'Editar Turno' : 'Agregar Turno' }}</h2>
        <form @submit.prevent="guardarTurno">
          <label for="nombre">Nombre del turno:</label>
          <input 
            id="nombre"
            v-model="formTurno.nombre" 
            type="text" 
            placeholder="Nombre del turno" 
            required 
          />

          <label for="dia_inicio">Día de inicio:</label>
          <select id="dia_inicio" v-model.number="formTurno.dia_inicio" required>
            <option disabled value="">Seleccione un día</option>
            <option v-for="(nombre, numero) in diasSemana" :key="numero" :value="numero">
              {{ nombre }}
            </option>
          </select>

          <label for="dia_fin">Día de fin:</label>
          <select id="dia_fin" v-model.number="formTurno.dia_fin" required>
            <option disabled value="">Seleccione un día</option>
            <option v-for="(nombre, numero) in diasSemana" :key="numero" :value="numero">
              {{ nombre }}
            </option>
          </select>

          <label for="hora_inicio">Hora de Inicio:</label>
          <input 
            id="hora_inicio"
            v-model="formTurno.hora_inicio" 
            type="time" 
            required 
          />
          
          <label for="hora_fin">Hora de Fin:</label>
          <input 
            id="hora_fin"
            v-model="formTurno.hora_fin" 
            type="time" 
            required 
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

const HOST = window.location.hostname
const API_TURNOS = `https://backend-production-04cf.up.railway.app/turnos`

// Días de la semana
const diasSemana = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo'
}

const obtenerNombreDia = (numero) => {
  return diasSemana[numero] || '-'
}

const turnos = ref([])
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const turnoEditando = ref(null)

const formTurno = ref({
  nombre: '',
  dia_inicio: '',
  dia_fin: '',
  hora_inicio: '',
  hora_fin: ''
})

const itemsPerPage = 5
const currentPage = ref(1)

const cargando = ref(false)
const cargandoAccion = ref(false)

const totalPages = computed(() => Math.ceil(turnos.value.length / itemsPerPage))
const indexOfLastTurno = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstTurno = computed(() => indexOfLastTurno.value - itemsPerPage)
const currentTurnos = computed(() => turnos.value.slice(indexOfFirstTurno.value, indexOfLastTurno.value))

const handlePageChange = (pageNumber) => {
  currentPage.value = pageNumber
}

const obtenerTurnos = async () => {
  cargando.value = true
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
  } finally {
    cargando.value = false
  }
}

const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  turnoEditando.value = null
  formTurno.value = {
    nombre: '',
    dia_inicio: '',
    dia_fin: '',
    hora_inicio: '',
    hora_fin: ''
  }
  mostrarFormulario.value = true
}

const editarTurno = (turno) => {
  modoEdicion.value = true
  turnoEditando.value = turno.id
  formTurno.value = {
    nombre: turno.nombre,
    dia_inicio: turno.diaInicio,
    dia_fin: turno.diaFin,
    hora_inicio: turno.horaInicio,
    hora_fin: turno.horaFin
  }
  mostrarFormulario.value = true
}

const guardarTurno = async () => {
  cargandoAccion.value = true
  try {
    if (modoEdicion.value) {
      await axios.patch(`${API_TURNOS}/${turnoEditando.value}`, formTurno.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Turno actualizado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_TURNOS, formTurno.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: 'Turno agregado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    }
    cerrarFormulario()
    await obtenerTurnos()
  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar turno:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar el turno',
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

const eliminarTurno = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar turno?',
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
      await axios.delete(`${API_TURNOS}/${id}`)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Turno eliminado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerTurnos()
      if (currentTurnos.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (error) {
      cargandoAccion.value = false
      console.error('Error al eliminar turno:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el turno',
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
  turnoEditando.value = null
}

onMounted(() => {
  obtenerTurnos()
})
</script>