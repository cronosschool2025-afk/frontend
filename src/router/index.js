import { createRouter, createWebHistory } from 'vue-router'
import axios from '../utils/axios-config'

//INDEX
import LandingView from '../views/landing/LandingView.vue'

// AUTH
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'

// ADMIN
import DashboardView from '../views/administrador/DashboardView.vue'
import AlumnosView from '../views/administrador/AlumnosView.vue'
import ProfesoresView from '../views/administrador/ProfesoresView.vue'
import MateriasView from '../views/administrador/MateriasView.vue'
import DivisionesView from '../views/administrador/DivisionesView.vue'
import EdificiosView from '../views/administrador/EdificiosView.vue'
import GruposView from '../views/administrador/GruposView.vue'
import HorariosView from '../views/administrador/HorariosView.vue'
import PeriodoView from '../views/administrador/PeriodoView.vue'
import TurnoView from '../views/administrador/TurnoView.vue'
import AulasView from '../views/administrador/AulasView.vue'
import ProfesoresHorariosView from '../views/administrador/ProfesoresHorariosView.vue'
import PerfilAdminView from '../views/administrador/PerfilAdminView.vue'
import ProfesorAsignaturas from '../views/administrador/ProfesorAsignaturas.vue'

// ESTUDIANTES
import AlumnosVView from '../views/alumnos/AlumnosView.vue'
import AlumnosVPerfilView from '../views/alumnos/AlumnosPerfilView.vue'

// PROFESORES
import ProfesoresVView from '../views/profesores/ProfesoresVView.vue'
import ProfesoresVPerfilView from '../views/profesores/ProfesoresPerfilView.vue'


const routes = [
  // 🔓 Rutas públicas
  { path: '/', name: 'landin-page', component: LandingView, meta: { requiresAuth: false } },
  { path: '/inicio-sesion', name: 'login', component: LoginView, meta: { requiresAuth: false } },
  { path: '/registro', name: 'registro', component: RegisterView, meta: { requiresAuth: false } },

  // 🔒 ADMIN
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/admin/perfil', name: 'perfil-admin', component: PerfilAdminView, meta: { requiresAuth: true, roles: ['admin'] }},

  { path: '/alumnos', name: 'alumnos', component: AlumnosView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/profesores', name: 'profesores', component: ProfesoresView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/materias', name: 'materias', component: MateriasView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/divisiones', name: 'divisiones', component: DivisionesView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/edificios', name: 'edificios', component: EdificiosView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/grupos', name: 'grupos', component: GruposView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/horarios', name: 'horarios', component: HorariosView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/periodo', name: 'periodo', component: PeriodoView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/turno', name: 'turno', component: TurnoView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/aulas', name: 'aulas', component: AulasView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/horarios-profesor', name: 'horarios-profesor', component: ProfesoresHorariosView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/horarios-profesor/:id', name: 'horarios-profesor-id', component: ProfesoresHorariosView, meta: { requiresAuth: true, roles: ['admin'] }},
  { path: '/profesoresasignaturas', name:'profesores-asignaturas', component: ProfesorAsignaturas, meta: {requiresAuth: true, roles: ['admin'] }},

  // 🔒 ESTUDIANTE
  { path: '/alumno', name: 'alumno-home', component: AlumnosVView, meta: { requiresAuth: true, roles: ['estudiante'] }},
  { path: '/alumno/perfil', name: 'alumno-perfil', component: AlumnosVPerfilView, meta: { requiresAuth: true, roles: ['estudiante'] }},

  // 🔒 PROFESOR
  { path: '/profesor', name: 'profesor-home', component: ProfesoresVView, meta: { requiresAuth: true, roles: ['profesor'] }},
  { path: '/profesor/perfil', name: 'profesor-perfil', component: ProfesoresVPerfilView, meta: { requiresAuth: true, roles: ['profesor'] }},
]


// ==========================
//  GUARD DE AUTENTICACIÓN
// ==========================
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('access_token')
  const rol = localStorage.getItem('rol')
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth) {
    if (!token) return next({ name: 'login' })

    try {
      await axios.post('/auth/validar-token', { token })

      if (to.meta.roles && !to.meta.roles.includes(rol)) {
        switch (rol) {
          case 'estudiante': return next({ name: 'alumno-home' })
          case 'profesor': return next({ name: 'profesor-home' })
          case 'admin': return next({ name: 'dashboard' })
          default: return next({ name: 'login' })
        }
      }

      return next()

    } catch (error) {
      localStorage.clear()
      return next({ name: 'login' })
    }
  }

  // 🔓 Si NO requiere auth y ya está logueado, redirigir
  if (token && (to.name === 'login' || to.name === 'registro')) {
    try {
      await axios.post('/auth/validar-token', { token })

      switch (rol) {
        case 'estudiante': return next({ name: 'alumno-home' })
        case 'profesor': return next({ name: 'profesor-home' })
        case 'admin': return next({ name: 'dashboard' })
      }
    } catch {
      localStorage.clear()
      return next()
    }
  }

  return next()
})

export default router
