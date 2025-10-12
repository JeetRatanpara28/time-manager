<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1>Create New User</h1>
        <p>Add a new team member to Time Manager Pro</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">Username *</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            required
            placeholder="Enter username"
            :disabled="loading"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="Enter email address"
            :disabled="loading"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Password *</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            placeholder="Enter password (min 6 characters)"
            :disabled="loading"
            class="form-input"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="role">Role *</label>
          <select
            id="role"
            v-model="formData.role"
            required
            :disabled="loading"
            class="form-input"
          >
            <option value="">Select a role</option>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option v-if="isGM" value="general_manager">General Manager</option>
          </select>
        </div>

        <div class="form-group">
          <label for="department">Department</label>
          <input
            id="department"
            v-model="formData.department"
            type="text"
            placeholder="e.g., Engineering, Sales, HR"
            :disabled="loading"
            class="form-input"
          />
        </div>

        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          <span class="success-icon">✅</span>
          {{ success }}
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            @click="goBack"
            :disabled="loading"
          >
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="loading-spinner"></span>
            {{ loading ? "Creating..." : "Create User" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/utils/api";
import { user as currentUser } from "@/store/authStore";

const router = useRouter();
const loading = ref(false);
const error = ref("");
const success = ref("");

const formData = ref({
  username: "",
  email: "",
  password: "",
  role: "",
  department: "",
});

const isGM = computed(
  () =>
    currentUser.value?.role === "gm" ||
    currentUser.value?.role === "general_manager"
);

const handleRegister = async () => {
  if (
    !formData.value.username ||
    !formData.value.email ||
    !formData.value.password ||
    !formData.value.role
  ) {
    error.value = "Please fill in all required fields";
    return;
  }

  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const userData = {
      name: formData.value.username, // Backend requires 'name' field
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password,
      role: formData.value.role,
    };

    // Add department if provided
    if (formData.value.department) {
      userData.department = formData.value.department;
    }

    const response = await apiClient.post("/auth/register", {
      user: userData,
    });

    if (response.data.success || response.data.user) {
      success.value = `User ${formData.value.username} created successfully!`;

      // Reset form
      formData.value = {
        username: "",
        email: "",
        password: "",
        role: "",
        department: "",
      };

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/manager/users");
      }, 2000);
    } else {
      error.value = "Failed to create user";
    }
  } catch (err) {
    console.error("Registration error:", err);
    console.error("Error response:", err.response?.data);
    console.error("Error status:", err.response?.status);
    console.error(
      "Full error details:",
      JSON.stringify(err.response?.data, null, 2)
    );
    error.value =
      err.response?.data?.error ||
      err.response?.data?.message ||
      "An error occurred during registration";
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  padding-bottom: 100px;
}

.register-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  width: 100%;
  max-width: 500px;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-header p {
  color: #64748b;
  font-size: 1.1rem;
}

.register-form {
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

.success-message {
  background: #d1fae5;
  color: #065f46;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #6ee7b7;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.error-icon,
.success-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 1rem 2rem;
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

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary:disabled,
.btn-secondary:disabled {
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .register-page {
    padding: 1rem;
  }

  .register-container {
    padding: 2rem;
  }

  .register-header h1 {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 1.5rem;
  }

  .register-header h1 {
    font-size: 1.75rem;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
