<template>
  <div class="app-wrapper">
    <nav class="nav">
      <div class="nav-container">
        <router-link to="/dashboard" class="nav-figure">
          <img src="../../imagenes/logo.png" class="nav-logo" alt="Logo Cronos" />
        </router-link>
        
        <label class="nav-toggle" for="menu-input">
          <input type="checkbox" id="menu-input" class="nav-input" />
        </label>

        <ul class="nav-list">
          <li class="nav-item"><router-link :to="{ name: 'perfil-admin' }" class="nav-link">Perfil</router-link></li>
        </ul>
      </div>
    </nav>

    <main class="main-content">
      <div class="hero-section">
        <h1 class="h1-x">Panel de Control</h1>
      </div>

      <div class="dashboard-grid">
        <!-- SECCIÓN: Gestión de Personas -->
        <router-link to="./alumnos" class="card card-1">
          <h2 class="card-title">Alumnos</h2>
          <p class="card-description">Gestión de estudiantes</p>
          <div class="card-arrow">→</div>
        </router-link>

        <router-link to="./profesores" class="card card-2">
          <h2 class="card-title">Profesores</h2>
          <p class="card-description">Personal docente</p>
          <div class="card-arrow">→</div>
        </router-link>

        <!-- SECCIÓN: Configuración Académica -->
        <router-link to="./materias" class="card card-3">
          <h2 class="card-title">Materias</h2>
          <p class="card-description">Asignaturas</p>
          <div class="card-arrow">→</div>
        </router-link>

        <router-link to="./divisiones" class="card card-4">
          <h2 class="card-title">Divisiones</h2>
          <p class="card-description">Organización académica</p>
          <div class="card-arrow">→</div>
        </router-link>

        <router-link to="./grupos" class="card card-5">
          <h2 class="card-title">Grupos</h2>
          <p class="card-description">Clases y secciones</p>
          <div class="card-arrow">→</div>
        </router-link>

        <!-- SECCIÓN: Infraestructura -->
        <router-link to="./edificios" class="card card-6">
          <h2 class="card-title">Edificios</h2>
          <p class="card-description">Infraestructura</p>
          <div class="card-arrow">→</div>
        </router-link>

        <router-link to="./aulas" class="card card-7">
          <h2 class="card-title">Aulas</h2>
          <p class="card-description">Salones disponibles</p>
          <div class="card-arrow">→</div>
        </router-link>

        <!-- SECCIÓN: Configuración Temporal -->
        <router-link to="./periodo" class="card card-8">
          <h2 class="card-title">Periodos</h2>
          <p class="card-description">Ciclos escolares</p>
          <div class="card-arrow">→</div>
        </router-link>

        <router-link to="./turno" class="card card-9">
          <h2 class="card-title">Turnos</h2>
          <p class="card-description">Horarios generales</p>
          <div class="card-arrow">→</div>
        </router-link>

        <!-- SECCIÓN: Asignaciones -->
        <router-link to="./profesoresasignaturas" class="card card-10">
          <h2 class="card-title">Asignación de Profesores</h2>
          <p class="card-description">Grupos y asignaturas a profesores</p>
          <div class="card-arrow">→</div>
        </router-link>

        <!-- SECCIÓN: Horarios (AL FINAL) -->
        <router-link to="./horarios" class="card card-11">
          <h2 class="card-title">Horarios</h2>
          <p class="card-description">Programación de clases</p>
          <div class="card-arrow">→</div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup>
import '../../assets/styles.css'
</script>