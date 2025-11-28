<template>
  <div class="login-wrapper login-bg">
    <div class="login-container">
      <img src="../../imagenes/logo1.png" class="img-lo-reg" alt="Logo Cronos" />
      <form @submit="handleSubmit" class="form-lg">
        <input 
          v-model="correo_electronico" 
          type="email" 
          placeholder="Correo electrónico" 
          required 
        />
        <input 
          v-model="contrasena" 
          type="password" 
          placeholder="Contraseña" 
          required 
        />
        <div class="btn-container">
          <button type="submit" class="btn-primary">Iniciar Sesión</button>
        </div>
      </form>
      <p class="regresar-l">
        ¿No tienes cuenta?
        <router-link :to="{ name: 'registro' }" class="nav-to">Regístrate aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import axios from '../../utils/axios-config' 
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()
const correo_electronico = ref('')
const contrasena = ref('')

// Manejador del submit - PREVIENE RECARGA
const handleSubmit = (event) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  login()
  return false
}

const login = async () => {
  // Validación de campos vacíos
  if (!correo_electronico.value || !contrasena.value) {
    Swal.fire({
      icon: 'error',
      title: 'Campos incompletos',
      text: 'Por favor, ingresa tu correo y contraseña.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '400px',
      allowOutsideClick: false
    })
    return
  }

  try {
    const res = await axios.post('/auth/login', {
      correo_electronico: correo_electronico.value,
      contrasena: contrasena.value
    })
    
    // Guardar datos en localStorage
    localStorage.setItem('access_token', res.data.token)
    localStorage.setItem('id', res.data.id)
    localStorage.setItem('id_rol', res.data.id_rol)
    localStorage.setItem('nombre', res.data.nombre)
    localStorage.setItem('rol', res.data.rol)

    // Mostrar mensaje de bienvenida
    await Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: `Hola ${res.data.nombre}`,
      showConfirmButton: false,
      timer: 2000,
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3ABEF9',
      width: '400px'
    })

    // Redirigir según el rol
    switch (res.data.rol) {
      case 'estudiante':
        router.push({ name: 'alumno-home' })
        break
      case 'admin':
        router.push({ name: 'dashboard' })
        break
      case 'profesor':
        router.push({ name: 'profesor-home' })
        break
      default:
        router.push({ name: 'login' })
    }

  } catch (err) {
    console.error('Error en login:', err)

    let mensajeError = 'Error al iniciar sesión'

    if (err.response) {
      const backendMessage = err.response.data?.message || err.response.data?.error

      if (backendMessage) {
        if (backendMessage.toLowerCase().includes('usuario')) {
          mensajeError = 'Usuario no encontrado'
        } else if (backendMessage.toLowerCase().includes('contraseña') || backendMessage.toLowerCase().includes('password')) {
          mensajeError = 'Contraseña incorrecta'
        } else {
          mensajeError = backendMessage
        }
      } else if (err.response.status === 404) {
        mensajeError = 'Usuario no encontrado'
      } else if (err.response.status === 401) {
        mensajeError = 'Contraseña incorrecta'
      }
    } else if (err.message) {
      mensajeError = err.message
    }

    // Mostrar error SIN await para evitar problemas
    Swal.fire({
      icon: 'error',
      title: 'Error de inicio de sesión',
      text: mensajeError,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '400px',
      allowOutsideClick: false
    })
  }
}
</script>