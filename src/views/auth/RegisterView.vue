<template>
  <div class="register-wrapper login-bg">
    <div class="register-container">
      <img src="../../imagenes/logo1.png" class="img-lo-reg" alt="Logo Cronos" />
      
      <form @submit="handleSubmit" class="form-lg">
        <input 
          v-model="nombre" 
          type="text" 
          placeholder="Nombre" 
          required 
        />
        <input 
          v-model="apellido_paterno" 
          type="text" 
          placeholder="Apellido Paterno" 
          required 
        />
        <input 
          v-model="apellido_materno" 
          type="text" 
          placeholder="Apellido Materno" 
          required 
        />

        <input 
          v-model="correo_electronico" 
          type="email" 
          placeholder="Correo electrónico" 
          @input="detectarRol"
          required 
        />

        <!-- Campo de contraseña con validación visual -->
        <input 
          v-model="contrasena" 
          type="password" 
          placeholder="Contraseña" 
          :class="{ 'error': mostrarInfo && !esContrasenaSegura }"
          required
          @input="mostrarInfo = true"
        />

        <p v-if="mostrarInfo && !esContrasenaSegura" class="password-info">
          ⚠️ La contraseña debe incluir al menos una mayúscula, una minúscula, un número, 
          un carácter especial y tener mínimo 8 caracteres.
        </p>

        <!-- Campos para PROFESOR -->
        <transition name="fade">
          <div v-show="esProfesor" class="profesor-fields">
            <input 
              v-model="telefono" 
              type="tel" 
              placeholder="Teléfono (10 dígitos)" 
              pattern="[0-9]{10}"
              maxlength="10"
              :required="esProfesor" 
            />
            <input 
              v-model="titulo" 
              type="text" 
              placeholder="Título académico (ej: Ing., Lic., Dr.)" 
              maxlength="100"
              :required="esProfesor" 
            />
          </div>
        </transition>

        <!-- Campo SELECT para ALUMNO -->
        <transition name="fade">
          <div v-show="!esProfesor && correo_electronico" class="estudiante-fields">
            <select v-model="id_grupo" required>
              <option value="" disabled selected>Selecciona un grupo</option>
              <option v-for="g in grupos" :key="g.id" :value="g.id">
                {{ g.grado }}° {{ g.abreviatura }} ({{ g.division?.nombre }})
              </option>
            </select>
          </div>
        </transition>

        <div class="btn-container">
          <button type="submit" class="btn-primary">Registrarse</button>
        </div>

        <p class="regresar">
          ¿Tienes cuenta?
          <router-link to="/inicio-sesion" class="nav-to">Inicia sesión</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import '../../assets/styles.css'
import axios from '../../utils/axios-config'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()

const nombre = ref('')
const apellido_paterno = ref('')
const apellido_materno = ref('')
const correo_electronico = ref('')
const contrasena = ref('')
const telefono = ref('')
const titulo = ref('')
const esProfesor = ref(false)
const mostrarInfo = ref(false)

const grupos = ref([])      
const id_grupo = ref(null)  

// Cargar grupos
const obtenerGrupos = async () => {
  try {
    const res = await axios.get("https://backend-production-04cf.up.railway.app/grupos")
    grupos.value = res.data
  } catch (error) {
    console.error("Error cargando grupos:", error)
  }
}

// Detectar si es profesor o alumno
const detectarRol = () => {
  const emailPart = correo_electronico.value.split('@')[0]
  const soloNumeros = /^\d+$/.test(emailPart)
  esProfesor.value = !soloNumeros && correo_electronico.value.length > 0

  if (!esProfesor.value && correo_electronico.value.length > 0) {
    obtenerGrupos()
  }
}

// Validación de contraseña
const tieneMinuscula = computed(() => /[a-z]/.test(contrasena.value))
const tieneMayuscula = computed(() => /[A-Z]/.test(contrasena.value))
const tieneNumero = computed(() => /\d/.test(contrasena.value))
const tieneEspecial = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena.value))
const longitudValida = computed(() => contrasena.value.length >= 8)

const esContrasenaSegura = computed(() => 
  tieneMinuscula.value && 
  tieneMayuscula.value && 
  tieneNumero.value && 
  tieneEspecial.value && 
  longitudValida.value
)

const register = async (event) => {
  // Prevenir recarga de página
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  if (!esContrasenaSegura.value) {
    Swal.fire({
      icon: 'info',
      title: 'Contraseña no segura',
      text: 'Asegúrate de que tu contraseña cumpla con todos los requisitos.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3ABEF9',
      width: '500px'
    })
    return
  }

  try {
    const payload = {
      nombre: nombre.value,
      apellido_paterno: apellido_paterno.value,
      apellido_materno: apellido_materno.value,
      correo_electronico: correo_electronico.value,
      contrasena: contrasena.value
    }

    if (esProfesor.value) {
      payload.telefono = telefono.value
      payload.titulo = titulo.value
    } else {
      payload.id_grupo = id_grupo.value
    }

    await axios.post('/auth/registro', payload)

    await Swal.fire({
      icon: 'success',
      title: '¡Registro exitoso!',
      text: 'Tu cuenta fue creada correctamente',
      showConfirmButton: false,
      timer: 2000,
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3ABEF9',
      width: '500px'
    })

    await Swal.fire({
      title: 'Aviso de Privacidad',
      html: `
        <div style="text-align: justify; padding: 0 20px;">
          <p style="margin-bottom: 16px; line-height: 24px; font-size: 16px;">
            En cumplimiento con las leyes de protección de datos, te informamos que la información 
            que proporciones será utilizada únicamente para fines académicos y administrativos, 
            garantizando la confidencialidad y seguridad de tus datos personales.
          </p>
          <p style="line-height: 24px; font-size: 16px;">
            Al hacer clic en "Aceptar", confirmas que has leído y aceptado nuestro aviso de privacidad.
          </p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3ABEF9',
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: '600px',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3ABEF9'
    })

    router.push({ name: 'login' })

  } catch (error) {
    console.error('Error completo al registrar:', error)
    
    let mensaje = 'Error al registrar usuario'
    
    if (error.response?.data?.message) {
      mensaje = error.response.data.message
    } else if (error.message) {
      mensaje = error.message
    }

    // NO usar await aquí
    Swal.fire({
      icon: 'error',
      title: 'Error al registrar',
      text: mensaje,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '500px',
      allowOutsideClick: false,
      allowEscapeKey: false
    })
  }
}
</script>