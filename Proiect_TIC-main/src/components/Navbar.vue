<template>
  <v-layout>
    <v-navigation-drawer class="bg-deep-purple" theme="dark" permanent>
      <v-list color="white">
        <v-list-item to="/">
          <v-icon class="mr-2 mdi">{{ mdiHome }}</v-icon>
          Home
        </v-list-item>
        <v-list-item to="/review">
          <v-icon class="mr-2">{{ mdiBookBox }}</v-icon>
          Review
        </v-list-item>
        <v-list-item to="/login">
          <v-icon class="mr-2">{{ mdiLoginBox }}</v-icon>
          Login
        </v-list-item>
        <v-list-item to="/register">
          <v-icon class="mr-2">{{ mdiRegisterBox }}</v-icon>
          Register
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
        
        </div>
      </template>
    </v-navigation-drawer>
    <v-main style="height: 400px">
      <router-view></router-view>
    </v-main>
  </v-layout>
</template>

<script>
import {
  VList,
  VListItem,
  VBtn,
  VLayout,
  VNavigationDrawer,
  VMain,
  VIcon
} from 'vuetify/lib/components';
import { mdiHome, mdiBookBox, mdiLoginBox, mdiRegisterBox } from '@mdi/js';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth';

export default {
  components: {
    VList,
    VListItem,
    VBtn,
    VLayout,
    VNavigationDrawer,
    VMain,
    VIcon
  },

  data() {
    return {
      mdiHome,
      mdiBookBox,
      mdiLoginBox,
      mdiRegisterBox,
      loggedIn: false
    };
  },

  created() {
    onAuthStateChanged(getAuth(), (user) => {
      this.loggedIn = !!user;
    });
  },

  methods: {
  async logout() {
    const auth = getAuth();
    
    // Verificăm dacă există un utilizator autentificat
    if (auth.currentUser) {
      try {
        // Deconectăm utilizatorul
        await signOut(auth);

        // După deconectare, verificăm dacă utilizatorul nu mai este autentificat
        if (!auth.currentUser) {
          // Poți face orice acțiuni suplimentare necesare
          this.$router.push('/login'); // Redirecționează utilizatorul către pagina de login
        }
      } catch (error) {
        console.log('Error signing out:', error);
      }
    } else {
      // Utilizatorul nu este autentificat, poți trata acest caz după cum dorești
      console.log('No user is currently authenticated.');
    }
  }
}

};
</script>
