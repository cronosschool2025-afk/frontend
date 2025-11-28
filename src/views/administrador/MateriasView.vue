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
    <h1 class="h1-x">Lista de Materias</h1>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <div class="table-container" v-else-if="materias.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th class="col-nombre">Nombre</th>
            <th class="col-abrev">Abreviatura</th>
            <th class="col-tipo">Tipo</th>
            <th class="col-division">División</th>
            <th class="col-color">Color</th>
            <th class="col-horas">Horas Semanales</th>
            <th class="col-min">Duración Minima</th>
            <th class="col-max">Duración Maxima</th>
            <th class="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="materia in currentMaterias" :key="materia.id">
            <td :data-label="'Nombre'">{{ materia.nombre }}</td>
            <td :data-label="'Abreviatura'">{{ materia.abreviatura || '-' }}</td>
            <td :data-label="'Tipo'">
              {{ materia.tipo === 'especialidad' ? 'Especialidad'
                 : materia.tipo === 'tronco_comun' ? 'Tronco común' : '-' }}
            </td>
            <td :data-label="'División'">{{ materia.division?.nombre || '-' }}</td>
            <td :data-label="'Color'">
              <div class="color-box" :style="{ backgroundColor: materia.colorIdentificador }"></div>
            </td>
            <td :data-label="'Horas Semanales'">{{ materia.horas_semanales || materia.horasSemanales || 0 }}</td>
            <td :data-label="'Duración Minima'">{{ materia.duracion_bloque_horas_min || materia.duracionBloqueHorasMin || '-' }}</td>
            <td :data-label="'Duración Maxima'">{{ materia.duracion_bloque_horas_max || materia.duracionBloqueHorasMax || '-' }}</td>
            <td :data-label="'Acciones'">
              <button class="btn-secondary btn-accion" @click="editarMateria(materia)">Editar</button>
              <button class="btn-danger btn-accion" @click="eliminarMateria(materia.id)">Eliminar</button>
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
        <h3>No hay materias registradas</h3>
        <p>Comienza agregando tu primera materia al sistema</p>
      </div>
    </div>

    <div class="btn-div">
      <button class="btn-primary" @click="abrirFormularioNuevo">Agregar</button>
    </div>

    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-container">
        <h2>{{ modoEdicion ? 'Editar Materia' : 'Agregar Materia' }}</h2>
        <form @submit.prevent="guardarMateria">
          <label for="nombre">Nombre:</label>
          <input 
            id="nombre"
            v-model="formMateria.nombre" 
            type="text" 
            required 
            placeholder="Nombre de la materia"
          />

          <label for="abreviatura">Abreviatura:</label>
          <input 
            id="abreviatura"
            v-model="formMateria.abreviatura" 
            type="text" 
            maxlength="10" 
            placeholder="Abreviatura"
          />

          <label for="tipo">Tipo:</label>
          <select id="tipo" v-model="formMateria.tipo" required>
            <option value="" disabled>Seleccione tipo</option>
            <option value="tronco_comun">Tronco común</option>
            <option value="especialidad">Especialidad</option>
          </select>

          <label for="division">División:</label>
          <select id="division" v-model.number="formMateria.division_id" required>
            <option value="" disabled>Seleccione división</option>
            <option v-for="division in divisiones" :key="division.id" :value="division.id">
              {{ division.nombre }}
            </option>
          </select>

          <label for="color">Color:</label>
          <input 
            id="color"
            type="color" 
            v-model="formMateria.color_identificador" 
            class="color-pointer"
          />

          <label for="horas_semanales">Horas semanales:</label>
          <input 
            id="horas_semanales"
            type="number" 
            v-model.number="formMateria.horas_semanales" 
            min="0" 
            required
          />

          <label for="duracion_min">Duración mínima:</label>
          <input 
            id="duracion_min"
            type="number" 
            v-model.number="formMateria.duracion_bloque_horas_min" 
            min="1" 
            required
          />

          <label for="duracion_max">Duración máxima:</label>
          <input 
            id="duracion_max"
            type="number" 
            v-model.number="formMateria.duracion_bloque_horas_max" 
            :min="formMateria.duracion_bloque_horas_min" 
            required
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
import Swal from 'sweetalert2'
import '../../assets/styles.css'

const HOST = window.location.hostname

const API_URL = `http://${HOST}:3000/asignaturas`
const API_DIVISIONES = `http://${HOST}:3000/divisiones`

// luego usas API_URL y API_DIVISIONES normalmente dentro del componente


const materias = ref([])
const divisiones = ref([])

const itemsPerPage = 3
const currentPage = ref(1)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const materiaEditando = ref(null)

const cargando = ref(false)
const cargandoAccion = ref(false)

const formMateria = ref({
  nombre: '',
  abreviatura: '',
  tipo: '',
  division_id: '',
  color_identificador: '#3498db',
  horas_semanales: 0,
  duracion_bloque_horas_min: 1,
  duracion_bloque_horas_max: 2
})

const totalPages = computed(() => Math.ceil(materias.value.length / itemsPerPage))
const indexOfLastMateria = computed(() => currentPage.value * itemsPerPage)
const indexOfFirstMateria = computed(() => indexOfLastMateria.value - itemsPerPage)
const currentMaterias = computed(() =>
  materias.value.slice(indexOfFirstMateria.value, indexOfLastMateria.value)
)

const handlePageChange = (pageNumber) => {
  currentPage.value = pageNumber
}

const obtenerMaterias = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_URL)
    materias.value = res.data
  } catch (error) {
    console.error('Error al obtener materias:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las materias',
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

const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  materiaEditando.value = null
  formMateria.value = {
    nombre: '',
    abreviatura: '',
    tipo: '',
    division_id: '',
    color_identificador: '#3498db',
    horas_semanales: 0,
    duracion_bloque_horas_min: 1,
    duracion_bloque_horas_max: 2
  }
  mostrarFormulario.value = true
}

const editarMateria = (materia) => {
  modoEdicion.value = true
  materiaEditando.value = materia.id
  formMateria.value = {
    nombre: materia.nombre || '',
    abreviatura: materia.abreviatura || '',
    tipo: materia.tipo || '',
    division_id: materia.division?.id || materia.division_id || '',
    color_identificador: materia.colorIdentificador || '#3498db',
    horas_semanales: materia.horas_semanales || materia.horasSemanales || 0,
    duracion_bloque_horas_min: materia.duracion_bloque_horas_min || materia.duracionBloqueHorasMin || 1,
    duracion_bloque_horas_max: materia.duracion_bloque_horas_max || materia.duracionBloqueHorasMax || 2
  }
  mostrarFormulario.value = true
}

const guardarMateria = async () => {
  cargandoAccion.value = true
  try {
    if (modoEdicion.value) {
      await axios.patch(`${API_URL}/${materiaEditando.value}`, formMateria.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Materia actualizada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    } else {
      await axios.post(API_URL, formMateria.value)
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: 'Materia agregada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
    }
    cerrarFormulario()
    await obtenerMaterias()
  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar materia:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'Error al guardar materia',
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

const eliminarMateria = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar materia?',
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
        text: 'Materia eliminada correctamente',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#213547',
        iconColor: '#3ABEF9',
        width: '450px',
      })
      await obtenerMaterias()
      if (currentMaterias.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (error) {
      cargandoAccion.value = false
      console.error('Error al eliminar materia:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la materia',
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
  materiaEditando.value = null
}

onMounted(() => {
  obtenerMaterias()
  obtenerDivisiones()
})
</script>