<template>
  <div>
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
        <li class="nav-item"><router-link :to="{ name:'perfil-admin' }" class="nav-link">Perfil</router-link></li>
        </ul>
      </div>
    </nav>

    <!-- LOADING DE ACCIÓN (al guardar cambios) -->
    <div v-if="cargandoAccion" class="action-loading">
      <div class="spinner"></div>
      <p>Procesando...</p>
    </div>

    <main class="perfil-main">
      <h1>Perfil</h1>

      <div v-if="cargando" class="loading-container">
        <div class="spinner"></div>
        <p>Cargando información...</p>
      </div>

      <div v-else class="perfil-content">
        <!-- Avatar dinámico con iniciales -->
        <div class="avatar-container">
          <div class="perfil-avatar">
            <span class="avatar-text">{{ obtenerIniciales(datos.usuario) }}</span>
          </div>
        </div>

        <!-- Información del usuario -->
        <div class="info-table">
          <div class="info-row">
            <span class="info-label">Usuario:</span>
            <span class="info-value">{{ datos.usuario.correo_electronico }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Contraseña:</span>
            <span class="info-value">{{ datos.usuario.passwordVisible }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nombre:</span>
            <span class="info-value">{{ datos.usuario.nombre }} {{ datos.usuario.apellido_paterno }} {{ datos.usuario.apellido_materno }}</span>
          </div>
        </div>
        <div class="btn-group">
          <button @click="editarPerfil" class="btn-primary">Editar Perfil</button>
          <button @click="cerrarSesion" class="btn-danger">Cerrar Sesión</button>
        </div>
      </div>
    </main>

    <!-- Formulario de Edición -->
    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cancelarEdicion">
      <div class="form-container">
        <h2>Editar Perfil</h2>
        
        <div class="form-lg">
          <div>
            <label>Nombre</label>
            <input 
              v-model="formData.nombre" 
              type="text" 
              placeholder="Nombre"
              :class="{ error: errors.nombre }"
            />
          </div>

          <div>
            <label>Apellido Paterno</label>
            <input 
              v-model="formData.apellido_paterno" 
              type="text" 
              placeholder="Apellido Paterno"
              :class="{ error: errors.apellido_paterno }"
            />
          </div>

          <div>
            <label>Apellido Materno</label>
            <input 
              v-model="formData.apellido_materno" 
              type="text" 
              placeholder="Apellido Materno"
            />
          </div>

          <div>
            <label>Correo Electrónico</label>
            <input 
              v-model="formData.correo_electronico" 
              type="email" 
              placeholder="correo@ejemplo.com"
              :class="{ error: errors.correo_electronico }"
            />
          </div>

          <div>
            <label>Nueva Contraseña (opcional)</label>
            <input 
              v-model="formData.password" 
              type="password" 
              placeholder="Dejar vacío para mantener la actual"
            />
          </div>

          <div v-if="formData.password">
            <label>Confirmar Contraseña</label>
            <input 
              v-model="formData.confirmarPassword" 
              type="password" 
              placeholder="Confirmar contraseña"
              :class="{ error: errors.confirmarPassword }"
            />
          </div>
        </div>

        <div class="form-buttons">
          <button @click="guardarCambios" class="btn-primary" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
          <button @click="cancelarEdicion" class="btn-secondary" :disabled="guardando">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import axios from "@/utils/axios-config"
import Swal from "sweetalert2"

const router = useRouter()
const id = localStorage.getItem("id")
const datos = ref({})
const cargando = ref(true)
const cargandoAccion = ref(false)
const mostrarFormulario = ref(false)
const guardando = ref(false)

const formData = ref({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  correo_electronico: '',
  password: '',
  confirmarPassword: ''
})

const errors = ref({
  nombre: false,
  apellido_paterno: false,
  correo_electronico: false,
  confirmarPassword: false
})

// Función para obtener iniciales
const obtenerIniciales = (usuario) => {
  if (!usuario) return ''
  const nombres = usuario.nombre?.split(' ')[0] || ''
  const apellido = usuario.apellido_paterno?.split(' ')[0] || ''
  return (nombres[0] || '') + (apellido[0] || '')
}

onMounted(async () => {
  try {
    const res = await axios.get(`/usuario/perfil/${id}`)
    datos.value = res.data
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar el perfil',
      confirmButtonText: 'Aceptar',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '400px',
      customClass: {
        confirmButton: 'swal-btn-primary'
      }
    })
  } finally {
    cargando.value = false
  }
})

const cerrarSesion = async () => {
  const confirm = await Swal.fire({
    title: '¿Deseas cerrar sesión?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar',
    background: '#ffffff',
    color: '#213547',
    iconColor: '#f39c12',
    width: '400px',
    customClass: {
      confirmButton: 'btn-primary',
      cancelButton: 'btn-secondary',
      actions: 'swal-actions-separated'
    },
  })

  if (confirm.isConfirmed) {
    localStorage.clear()
    await Swal.fire({
      icon: 'success',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión correctamente.',
      showConfirmButton: false,
      timer: 2000,
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3abef9',
      width: '400px',
    })
    router.push({ name: 'landin-page' })
  }
}

const editarPerfil = () => {
  // Cargar datos actuales en el formulario
  formData.value = {
    nombre: datos.value.usuario.nombre || '',
    apellido_paterno: datos.value.usuario.apellido_paterno || '',
    apellido_materno: datos.value.usuario.apellido_materno || '',
    correo_electronico: datos.value.usuario.correo_electronico || '',
    password: '',
    confirmarPassword: ''
  }
  
  // Limpiar errores
  errors.value = {
    nombre: false,
    apellido_paterno: false,
    correo_electronico: false,
    confirmarPassword: false
  }
  
  mostrarFormulario.value = true
}

const validarFormulario = () => {
  let valido = true
  
  // Resetear errores
  errors.value = {
    nombre: false,
    apellido_paterno: false,
    correo_electronico: false,
    confirmarPassword: false
  }
  
  // Validar nombre
  if (!formData.value.nombre.trim()) {
    errors.value.nombre = true
    valido = false
  }
  
  // Validar apellido paterno
  if (!formData.value.apellido_paterno.trim()) {
    errors.value.apellido_paterno = true
    valido = false
  }
  
  // Validar correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.value.correo_electronico.trim() || !emailRegex.test(formData.value.correo_electronico)) {
    errors.value.correo_electronico = true
    valido = false
  }
  
  // Validar contraseñas si se ingresó una nueva
  if (formData.value.password) {
    if (formData.value.password !== formData.value.confirmarPassword) {
      errors.value.confirmarPassword = true
      valido = false
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden',
        confirmButtonText: 'Aceptar',
        background: '#ffffff',
        color: '#213547',
        iconColor: '#E54848',
        width: '400px',
        customClass: {
          confirmButton: 'btn-primary'
        }
      })
    }
  }
  
  return valido
}

const guardarCambios = async () => {
  if (!validarFormulario()) return
  
  guardando.value = true
  cargandoAccion.value = true
  
  try {
    const datosActualizar = {
      nombre: formData.value.nombre,
      apellido_paterno: formData.value.apellido_paterno,
      apellido_materno: formData.value.apellido_materno,
      correo_electronico: formData.value.correo_electronico
    }
    
    // Solo incluir password si se ingresó uno nuevo
    if (formData.value.password) {
      datosActualizar.password = formData.value.password
    }
    
    await axios.put(`/usuario/perfil/${id}`, datosActualizar)
    
    // Recargar datos del perfil
    const res = await axios.get(`/usuario/perfil/${id}`)
    datos.value = res.data
    
    mostrarFormulario.value = false
    
    await Swal.fire({
      icon: 'success',
      title: '¡Perfil actualizado!',
      text: 'Los cambios se han guardado correctamente.',
      showConfirmButton: false,
      timer: 2000,
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3abef9',
      width: '400px',
    })
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'No se pudo actualizar el perfil',
      confirmButtonText: 'Aceptar',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '400px',
      customClass: {
        confirmButton: 'btn-primary'
      }
    })
  } finally {
    guardando.value = false
    cargandoAccion.value = false
  }
}

const cancelarEdicion = () => {
  mostrarFormulario.value = false
  formData.value = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo_electronico: '',
    password: '',
    confirmarPassword: ''
  }
}
</script>