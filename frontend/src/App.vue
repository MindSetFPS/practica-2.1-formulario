<template>
  <div class="login-container">
    <div class="form-toggle">
      <button @click="mode = 'login'" :class="{ active: mode === 'login' }">Login</button>
      <button @click="mode = 'register'" :class="{ active: mode === 'register' }">Register</button>
    </div>

    <form @submit.prevent="handleSubmit" class="login-form" novalidate>
      <h1>{{ mode === 'login' ? 'Login' : 'Register' }}</h1>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
        />
        <span v-if="errors.email" class="error">{{ errors.email[0] }}</span>
      </div>

      <div class="form-group password-group">
        <label for="password">Password</label>
        <div class="password-input-wrapper">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
          />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <span v-if="errors.password" class="error">{{ errors.password[0] }}</span>
      </div>

      <div v-if="mode === 'register'" class="form-group password-group">
        <label for="confirmPassword">Confirm Password</label>
        <div class="password-input-wrapper">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            required
          />
        </div>
        <span v-if="errors.confirmPassword" class="error">{{ errors.confirmPassword[0] }}</span>
      </div>

      <div v-if="mode === 'login'" class="form-group">
        <label>Human Verification</label>
        <div class="captcha-box">
          <span>{{ captcha.num1 }} + {{ captcha.num2 }} = </span>
          <input
            v-model="captchaInput"
            type="number"
            class="captcha-input"
            placeholder="?"
          />
          <button type="button" class="refresh-captcha" @click="generateCaptcha">↻</button>
        </div>
        <span v-if="errors.human" class="error">{{ errors.human }}</span>
      </div>

      <button type="submit" :disabled="isLoading || !isFormValid">
        {{ isLoading ? (mode === 'login' ? 'Logging in...' : 'Creating account...') : (mode === 'login' ? 'Login' : 'Register') }}
      </button>

      <p v-if="serverError" class="server-error">{{ serverError }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { validateLogin, validateRegister } from './validation.js';

const mode = ref('login');
const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
});

const errors = reactive({
  email: null,
  password: null,
  confirmPassword: null,
  human: null
});

const isLoading = ref(false);
const serverError = ref('');
const successMessage = ref('');
const humanToken = ref('');
const showPassword = ref(false);
const captchaInput = ref('');
const captcha = ref({ num1: 0, num2: 0, answer: 0 });

function generateCaptcha() {
  captcha.value = {
    num1: Math.floor(Math.random() * 10) + 1,
    num2: Math.floor(Math.random() * 10) + 1,
    answer: 0
  };
  captcha.value.answer = captcha.value.num1 + captcha.value.num2;
  captchaInput.value = '';
}

generateCaptcha();

const isFormValid = computed(() => {
  const captchaValid = mode.value !== 'login' || parseInt(captchaInput.value) === captcha.value.answer;
  if (mode.value === 'login') {
    return form.email.includes('@') && form.password.length > 0 && captchaValid;
  } else {
    return form.email.includes('@') && 
           form.password.length > 0 && 
           form.confirmPassword.length > 0;
  }
});

async function handleSubmit() {
  serverError.value = '';
  successMessage.value = '';
  
  errors.email = null;
  errors.password = null;
  errors.confirmPassword = null;
  errors.human = null;

  let validation;
  if (mode.value === 'login') {
    validation = validateLogin({
      email: form.email,
      password: form.password
    });
  } else {
    validation = validateRegister({
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword
    });
  }

  if (!validation.valid) {
    if (validation.errors.email) errors.email = validation.errors.email;
    if (validation.errors.password) errors.password = validation.errors.password;
    if (validation.errors.confirmPassword) errors.confirmPassword = validation.errors.confirmPassword;
    return;
  }

  isLoading.value = true;

  try {
    const endpoint = mode.value === 'login' ? '/api/login' : '/api/register';
    const body = {
      email: form.email,
      password: form.password,
      ...(mode.value === 'login' ? { humanToken: captchaInput.value, captchaAnswer: captcha.value.answer } : { confirmPassword: form.confirmPassword })
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.errors) {
        if (data.errors.email) errors.email = data.errors.email;
        if (data.errors.password) errors.password = data.errors.password;
        if (data.errors.confirmPassword) errors.confirmPassword = data.errors.confirmPassword;
        if (data.errors.human) {
          errors.human = data.errors.human;
          generateCaptcha();
        }
      }
      serverError.value = data.message || (mode.value === 'login' ? 'Login failed' : 'Registration failed');
    } else {
      if (mode.value === 'register') {
        successMessage.value = 'Account created successfully! Please login.';
        mode.value = 'login';
        form.password = '';
        form.confirmPassword = '';
        generateCaptcha();
      } else {
        successMessage.value = data.message || 'Login successful';
        generateCaptcha();
      }
    }
  } catch (err) {
    serverError.value = 'Network error';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 1rem;
}

.form-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-toggle button {
  width: auto;
  padding: 0.5rem 1.5rem;
  background: #6c757d;
}

.form-toggle button.active {
  background: #007bff;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  margin: 0 0 1.5rem;
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.password-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.password-input-wrapper input {
  flex: 1;
}

.toggle-password {
  padding: 0.5rem 0.75rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  white-space: nowrap;
  width: 5rem;
}

.toggle-password:hover {
  background: #5a6268;
}

input:focus {
  outline: none;
  border-color: #007bff;
}

.error {
  display: block;
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.server-error {
  color: #dc3545;
  text-align: center;
}

.success {
  color: #28a745;
  text-align: center;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.captcha-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.captcha-box span {
  font-weight: 500;
  color: #333;
}

.captcha-input {
  width: 60px !important;
  text-align: center;
}

.refresh-captcha {
  width: auto !important;
  padding: 0.5rem;
  font-size: 1.25rem;
}
</style>
