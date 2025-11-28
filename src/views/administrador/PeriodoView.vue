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
    <h1 class="h1-x">Lista de Períodos</h1>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <div class="table-container" v-else-if="periodos.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="periodo in currentPeriodos" :key="periodo.id">
            <td :data-label="'Nombre'">{{ periodo.nombre }}</td>
            <td :data-label="'Fecha Inicio'">{{ periodo.fechaInicio }}</td>
            <td :data-label="'Fecha Fin'">{{ periodo.fechaFin }}</td>
            <td :data-label="'Activo'">
              <span :style="{ color: periodo.activo ? '#3ABEF9' : '#E54848', fontWeight: '600' }">
                {{ periodo.activo ? 'Sí' : 'No' }}
              </span>
            </td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarPeriodo(periodo)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarPeriodo(periodo.id)">Eliminar</button>
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
        <h3>No hay períodos registrados</h3>
        <p>Comienza agregando tu primer período al sistema</p>
      </div>
    </div>

    <div class="btn-div">
      <button class="btn-primary" @click="abrirFormularioNuevo">
        Agregar
      </button>
    </div>

    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-container">
        <h2>{{ modoEdicion ? 'Editar Período' : 'Agregar Período' }}</h2>
        <form @submit.prevent="guardarPeriodo">
          <label for="nombre">Nombre del período:</label>
          <input 
            id="nombre"
            v-model="formPeriodo.nombre" 
            type="text" 
            placeholder="Nombre del período" 
            required 
          />
          
          <label for="fecha_inicio">Fecha de Inicio:</label>
          <input 
            id="fecha_inicio"
            v-model="formPeriodo.fecha_inicio" 
            type="date" 
            required 
          />
          
          <label for="fecha_fin">Fecha de Fin:</label>
          <input 
            id="fecha_fin"
            v-model="formPeriodo.fecha_fin" 
            type="date" 
            required 
          />
          
          <label for="activo">Estado:</label>
          <select id="activo" v-model="formPeriodo.activo">
            <option :value="true">Activo</option>
            <option :value="false">Inactivo</option>
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

const API_PERIODOS = `https://backend-production-04cf.up.railway.app/periodos`


const periodos = ref([])
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const periodoEditando = ref(null)

const formPeriodo = ref({
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  activo: true
})

const itemsPerPage = 5
const currentPage = ref(1)

const cargando = ref(false)
const cargandoAccion = ref(false)

const totalPages = computed(() => Math.ceil(periodos.value.length / itemsPerPage))
const indexOfLastPeriodo = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstPeriodo = computed(() => indexOfLastPeriodo.value - itemsPerPage)
const currentPeriodos = computed(() => periodos.value.slice(indexOfFirstPeriodo.value, indexOfLastPeriodo.value))

const handlePageChange = (pageNumber) => {
  currentPage.value = pageNumber
}

const obtenerPeriodos = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_PERIODOS)
    periodos.value = res.data
  } catch (error) {
    console.error('Error al obtener períodos:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los períodos',
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
  periodoEditando.value = null
  formPeriodo.value = {
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true
  }
  mostrarFormulario.value = true
}

const editarPeriodo = (periodo) => {
  modoEdicion.value = true
  periodoEditando.value = periodo.id
  formPeriodo.value = {
    nombre: periodo.nombre,
    fecha_inicio: periodo.fechaInicio,
    fecha_fin: periodo.fechaFin,
    activo: periodo.activo
  }
  mostrarFormulario.value = true
}

const guardarPeriodo = async () => {
  cargandoAccion.value = true
  try {
    if (modoEdicion.value) {
      await axios.patch(`${API_PERIODOS}/${periodoEditando.value}`, formPeriodo.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Período actualizado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_PERIODOS, formPeriodo.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: 'Período agregado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    }
    cerrarFormulario()
    await obtenerPeriodos()
  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar período:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar el período',
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

const eliminarPeriodo = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar período?',
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
      await axios.delete(`${API_PERIODOS}/${id}`)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Período eliminado correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerPeriodos()
      if (currentPeriodos.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (error) {
      cargandoAccion.value = false
      console.error('Error al eliminar período:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el período',
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
  periodoEditando.value = null
}

onMounted(() => {
  obtenerPeriodos()
})
</script>