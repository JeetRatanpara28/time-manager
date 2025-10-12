<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>Time Manager Pro</h1>
        <p>Welcome back! Please sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="loginForm.email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="isLoading"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            required
            placeholder="Enter your password"
            :disabled="isLoading"
            class="form-input"
          />
        </div>

        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>

        <div class="demo-credentials">
          <h4>Demo Credentials:</h4>
          <div class="credential-item">
            <strong>Employee:</strong> employee@example.com / password123
          </div>
          <div class="credential-item">
            <strong>Manager:</strong> manager@example.com / password123
          </div>
          <div class="credential-item">
            <strong>GM:</strong> gm@example.com / password123
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { login } from '@/composables/useAuthStore.js';

const loginForm = reactive({
  email: '',
  password: ''
});

const isLoading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    error.value = 'Please fill in all fields';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const result = await login(loginForm.email, loginForm.password);

    if (result.success) {
      console.log('✅ Login successful, user will be redirected by App.vue');
      // App.vue will handle navigation based on role
    } else {
      error.value = result.error || 'Login failed';
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = 'An unexpected error occurred. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  width: 100%;
  max-width: 450px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-header p {
  color: #64748b;
  font-size: 1.1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.error-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.login-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.demo-credentials {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.demo-credentials h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.credential-item {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #667eea;
}

.credential-item strong {
  color: #374151;
}

@media (max-width: 768px) {
  .login-page {
    padding: 1rem;
  }

  .login-container {
    padding: 2rem;
  }

  .login-header h1 {
    font-size: 2rem;
  }

  .demo-credentials {
    padding: 1rem;
  }
}
</style>