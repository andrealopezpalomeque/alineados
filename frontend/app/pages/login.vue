<script setup lang="ts">
definePageMeta({
  layout: false,
})

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref(false)

function handleLogin() {
  error.value = false
  const success = authStore.login(username.value, password.value)
  if (success) {
    navigateTo('/')
  } else {
    error.value = true
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 font-sans">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-8 flex flex-col items-center">
        <img src="/logos/logo-icon-light.svg" alt="Alineados" class="mb-4 h-14 w-14" />
        <h1 class="font-display text-2xl font-bold text-white">Alineados</h1>
        <p class="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Inteligencia Politica
        </p>
      </div>

      <!-- Card -->
      <div class="rounded-2xl bg-white p-8 shadow-xl">
        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <div>
            <label for="username" class="mb-1.5 block text-sm font-medium text-slate-700">
              Usuario
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Usuario"
            />
          </div>

          <div>
            <label for="password" class="mb-1.5 block text-sm font-medium text-slate-700">
              Contrasena
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Contrasena"
              @keyup.enter="handleLogin"
            />
          </div>

          <button
            type="submit"
            class="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Ingresar
          </button>

          <p v-if="error" class="text-center text-sm text-red-500">
            Credenciales incorrectas
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
