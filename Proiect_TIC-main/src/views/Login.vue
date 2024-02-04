<template>
    <v-app id="inspire">
      <v-content>
        <v-container class="fill-height" fluid>
          <v-row justify="center">
            <v-col cols="12" sm="8" md="8">
              <v-card id="myCard" class="elevation-12">
                <v-window v-model="step">
                  <v-window-item :value="1">
                    <v-row justify="center">
                      <v-col cols="12" md="8">
                        <v-card-text class="mt-12">
                          <h1 class="text-center display-2">
                           Sign in to your account
                          </h1>
                          <v-form ref="form" v-model="valid" lazy-validation>
                            <v-text-field
                              v-model="email"
                              label="Email"
                              name="Email"
                              :rules="emailRules"
                              prepend-icon="email"
                              type="text"
                              color=""
                            />
                            <v-text-field
                              v-model="password"
                              id="password"
                              :type="showPassword ? 'text' : 'password'"
                              label="Password"
                              append-icon="mdi-eye"
                              @click:append="toggleShowPassword"
                              name="password"
                              :rules="passwordRules"
                              prepend-icon="lock"
                              type="password"
                              color="brown lighten-2"
                            />
                            <div v-if="error" class="error-message">{{ errorMessage }}</div>
                          </v-form>
                        </v-card-text>
                        <div class="text-center mt-3">
                          <v-btn @click="login" rounded color="bg-deep-purple" dark>
                            LOGIN
                          </v-btn>
                        </div>
                      </v-col>
                      <v-col cols="12" md="4" class="brown-background">
                        <v-card-text class="white--text mt-12">
                          <h1 class="text-center display-1"></h1>
                          <h5 class="text-center">
                          </h5>
                        </v-card-text>
                      </v-col>
                    </v-row>
                  </v-window-item>
                </v-window>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-content>
    </v-app>
  </template>

<script>
import axios from 'axios';
import {
  VApp,
  VContent,
  VContainer,
  VRow,
  VCol,
  VCard,
  VCardText,
  VForm,
  VTextField,
  VBtn,
  VWindow,
  VAlert,
  VWindowItem
} from 'vuetify/lib/components';

export default {
  components: {
    VApp,
    VContent,
    VContainer,
    VRow,
    VCol,
    VCard,
    VCardText,
    VAlert,
    VForm,
    VTextField,
    VBtn,
    VWindow,
    VWindowItem
  },
  data: () => ({
    step: 1,
    valid: false,
    error: false,
    errorMessage: "",
    email: "",
    password: "",
    showPassword: false,
    emailRules: [
      v => !!v || "Email is required",
      v => /.+@.+\..+/.test(v) || "Email must be valid",
    ],
    passwordRules: [
      v => !!v || "Password is required",
      v => v.length >= 8 || "Password must be at least 8 characters",
    ],
  }),
  methods: {
    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    },
    async login() {
      try {
        await this.$refs.form.validate();
        if (this.valid) {
          this.error = false;

          const response = await axios.post('http://localhost:3001/login', {
            email: this.email,
            password: this.password,
          });

          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userName', response.data.userName);
            console.log("Login successful with", this.email, this.password);
            console.log("Token stored:", response.data.token);
            this.$router.push({ name: 'Reviews' });
          } else { 
            console.error("Login failed. No token received.");
            this.error = true;
          }
        } else {
          this.error = true;
          this.errorMessage = "Please input valid data";
          VAlert("Please input valid data");
        }
      } catch (error) {
        console.error("Error during login:", error.message, error.response.data.error);
        this.error = true;
        this.errorMessage = error.response.data.error;
      }
    },
  },
};
</script>

<style scoped>
h1 {
  margin-bottom: 15%;
  font-family: 'Times New Roman', cursive;
}

h5 {
  font-family: 'Quicksand', sans-serif;
}

.v-form {
  max-width: 400px;
  margin: auto;
}

.v-form .v-text-field {
  margin-bottom: 16px;
}

.v-btn {
  margin-top: 5%;
  margin-bottom: 5%;
}

.v-btn:hover {
  background-color: white
}

.brown-background {
  background: linear-gradient(to bottom, rgb(241, 241, 197));
}

.error-message {
  font-style: italic;
  color: rgb(165, 73, 42);
  margin-top: 2%;
  font-family: 'Quicksand', sans-serif;
}

#inspire {
  height: 100vh; /* Ensures that the element takes up the full height of the viewport */
  background: linear-gradient(white, #673AB7);
}

#myCard {
  margin-top: 10vh;
}

</style>
