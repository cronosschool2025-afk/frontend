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
    <h1 class="h1-x">
      Disponibilidad del Profesor
      <span v-if="nombreProfesor" style="font-weight: 400; font-size: 24px;">({{ nombreProfesor }})</span>
    </h1>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <div v-else-if="profesorSeleccionado && horasMostradas.length">
      <div class="turno-selector" v-if="turnos.length">
        <label for="turno">Filtrar por turno:</label>
        <select id="turno" v-model="turnoSeleccionado" @change="filtrarHorasPorTurno">
          <option value="">Todas las horas (7:00 - 22:00)</option>
          <option v-for="turno in turnos" :key="turno.id" :value="turno.id">
            {{ turno.nombre }}
          </option>
        </select>
      </div>

      <div class="color-selector">
        <div
          v-for="color in colores"
          :key="color.estado"
          class="color-circulo"
          :class="{ activo: color.estado === colorSeleccionado }"
          @click="seleccionarColor(color.estado)"
        >
          <div 
            class="circulo" 
            :style="{ backgroundColor: color.color }"
          ></div>
          <span>{{ color.nombre }}</span>
        </div>
      </div>

      <div class="horario-grid-container">
        <table class="horario-grid">
          <thead>
            <tr>
              <th>Hora / Día</th>
              <th v-for="dia in diasSemana" :key="dia.valor">{{ dia.nombre }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="hora in horasMostradas" :key="hora">
              <td>{{ hora }}</td>
              <td
                v-for="dia in diasSemana"
                :key="dia.valor"
                class="celda"
                :class="estadoCelda(dia.valor, hora)"
                @click="pintarCelda(dia.valor, hora)"
              ></td>
            </tr>
          </tbody>
        </table>

        <div class="btn-div" style="display:flex; gap:15px; justify-content:center;">
          <router-link to="/profesores">
            <button class="btn-secondary">
              Cancelar
            </button>
          </router-link>
          <button class="btn-primary" @click="guardarCambios">
            Guardar
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-content">
        <h3>No se pudo cargar la información</h3>
        <p>Por favor, intenta de nuevo más tarde</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import '../../assets/styles.css'
import Swal from 'sweetalert2'

// APIs
const HOST = window.location.hostname

const API_HORARIOS = `http://${HOST}:3000/horario-profesor`
const API_PROFESORES = `http://${HOST}:3000/profesores`
const API_TURNOS = `http://${HOST}:3000/turnos`

// Router
const router = useRouter()

// Refs
const profesorSeleccionado = ref('')
const horariosProfesor = ref([])
const nombreProfesor = ref('')
const turnos = ref([])
const turnoSeleccionado = ref('')
const todasLasHoras = ref([])
const horasMostradas = ref([])

const cambiosPendientes = ref(new Set())

const cargando = ref(false)
const cargandoAccion = ref(false)

const diasSemana = [
  { valor: '1', nombre: 'Lunes' },
  { valor: '2', nombre: 'Martes' },
  { valor: '3', nombre: 'Miércoles' },
  { valor: '4', nombre: 'Jueves' },
  { valor: '5', nombre: 'Viernes' },
]

const colores = [
  { nombre: 'Disponible', estado: 'disponible', color: '#b8e1f4' },
  { nombre: 'No disponible', estado: 'no_disponible', color: '#eb9696' },
]

const colorSeleccionado = ref('disponible')

const seleccionarColor = (estado) => {
  colorSeleccionado.value = estado
}

const normalizarHora = (hora) => hora.slice(0, 5)

const generarTodasLasHoras = () => {
  const horas = []
  for (let h = 7; h <= 22; h++) {
    horas.push(h.toString().padStart(2, '0') + ':00')
  }
  todasLasHoras.value = horas
  horasMostradas.value = horas
}

const cargarDatosProfesor = async () => {
  const id = useRoute().params.id
  if (!id) return

  cargando.value = true
  profesorSeleccionado.value = id
  
  generarTodasLasHoras()
  
  try {
    const resProf = await axios.get(`${API_PROFESORES}/${id}`)
    const prof = resProf.data
    nombreProfesor.value = `${prof.usuario?.nombre || ''} ${prof.usuario?.apellido_paterno || ''}`
    await cargarTurnos()
    await cargarHorarioProfesor()
  } catch (error) {
    console.error('Error al cargar datos del profesor:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar la información del profesor',
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

const cargarTurnos = async () => {
  try {
    const res = await axios.get(API_TURNOS)
    turnos.value = res.data
  } catch (error) {
    console.error('Error al cargar turnos:', error)
  }
}

const filtrarHorasPorTurno = () => {
  if (!turnoSeleccionado.value) {
    horasMostradas.value = todasLasHoras.value
    return
  }

  const turno = turnos.value.find((t) => t.id === turnoSeleccionado.value)
  if (!turno) {
    horasMostradas.value = todasLasHoras.value
    return
  }

  const horaInicioRaw = turno.horaInicio || turno.hora_inicio
  const horaFinRaw = turno.horaFin || turno.hora_fin

  if (!horaInicioRaw || !horaFinRaw) {
    horasMostradas.value = todasLasHoras.value
    return
  }

  const horaInicio = parseInt(horaInicioRaw.split(':')[0])
  const horaFin = parseInt(horaFinRaw.split(':')[0])

  const horasFiltradas = []
  for (let h = horaInicio; h <= horaFin; h++) {
    horasFiltradas.push(h.toString().padStart(2, '0') + ':00')
  }
  horasMostradas.value = horasFiltradas
}

const cargarHorarioProfesor = async () => {
  try {
    const res = await axios.get(`${API_HORARIOS}/profesor/${profesorSeleccionado.value}`)
    
    horariosProfesor.value = res.data.map((h) => ({
      id: h.id,
      dia: String(h.dia),
      hora: normalizarHora(h.hora),
      estado: h.disponible ? 'disponible' : 'no_disponible',
      disponible: h.disponible,
      id_profesor: h.id_profesor || Number(profesorSeleccionado.value),
    }))
  } catch (error) {
    console.error('Error al cargar horario del profesor:', error)
    horariosProfesor.value = []
  }
}

const marcarCambio = (dia, hora) => {
  const clave = `${dia}-${hora}`
  cambiosPendientes.value.add(clave)
}

const pintarCelda = (dia, hora) => {
  const index = horariosProfesor.value.findIndex(
    (h) => h.dia === String(dia) && h.hora === hora
  )

  if (index !== -1) {
    const celda = horariosProfesor.value[index]

    if (celda.estado === colorSeleccionado.value) {
      // Si hace clic en el mismo color, eliminar el registro
      horariosProfesor.value.splice(index, 1)
      marcarCambio(dia, hora)
      return
    }

    // Cambiar estado
    celda.estado = colorSeleccionado.value
    celda.disponible = colorSeleccionado.value === 'disponible'
    marcarCambio(dia, hora)
    return
  }

  // Crear nuevo registro
  horariosProfesor.value.push({
    dia: String(dia),
    hora,
    estado: colorSeleccionado.value,
    disponible: colorSeleccionado.value === 'disponible',
    id_profesor: Number(profesorSeleccionado.value),
  })
  marcarCambio(dia, hora)
}

const estadoCelda = (dia, hora) => {
  const registro = horariosProfesor.value.find((h) => h.dia === String(dia) && h.hora === hora)
  return registro ? registro.estado : ''
}

const guardarCambios = async () => {
  if (cambiosPendientes.value.size === 0) {
    await Swal.fire({
      icon: 'info',
      title: 'Sin cambios',
      text: 'No hay modificaciones para guardar',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      width: '450px',
    })
    return
  }

  cargandoAccion.value = true
  try {
    const promesas = []

    // Procesar cada celda modificada
    for (const clave of cambiosPendientes.value) {
      const [dia, hora] = clave.split('-')
      const registro = horariosProfesor.value.find(
        (h) => h.dia === dia && h.hora === hora
      )

      if (registro) {
        if (registro.id) {
          // ACTUALIZAR registro existente
          promesas.push(
            axios.patch(`${API_HORARIOS}/${registro.id}`, {
              disponible: registro.disponible,
            })
          )
        } else {
          // CREAR nuevo registro
          promesas.push(
            axios.post(API_HORARIOS, {
              dia: registro.dia,
              hora: registro.hora,
              disponible: registro.disponible,
              id_profesor: registro.id_profesor,
            })
          )
        }
      } else {
        // ELIMINAR registro (si existía antes)
        const registroOriginal = horariosProfesor.value.find(
          (h) => h.dia === dia && h.hora === hora && h.id
        )
        if (registroOriginal?.id) {
          promesas.push(axios.delete(`${API_HORARIOS}/${registroOriginal.id}`))
        }
      }
    }

    // Ejecutar todas las operaciones
    await Promise.all(promesas)
    cargandoAccion.value = false
    
    await Swal.fire({
      icon: 'success',
      title: '¡Guardado!',
      text: 'Disponibilidad actualizada correctamente',
      showConfirmButton: false,
      timer: 2000,
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3ABEF9',
      width: '450px',
    })

    // Limpiar cambios pendientes y redirigir
    cambiosPendientes.value.clear()
    router.push('/profesores')

  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar cambios:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar la disponibilidad',
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

onMounted(cargarDatosProfesor)
</script>