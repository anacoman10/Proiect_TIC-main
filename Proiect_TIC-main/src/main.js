import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import axios from 'axios'; 
import { firebase, initializeApp } from 'firebase/app';
import 'vuetify/dist/vuetify.min.css';
import { createVuetify } from 'vuetify'; 

const aplicatie = createApp(App);

aplicatie.use(router);
aplicatie.use(store);


const firebaseConfig = {
  apiKey: "AIzaSyB_O2v6Ho-A5y4m4MNpB0T-Yf-yeJmH0yk",
  authDomain: "app-tic-51e3f.firebaseapp.com",
  projectId: "app-tic-51e3f",
  storageBucket: "app-tic-51e3f.appspot.com",
  messagingSenderId: "577458810965",
  appId: "1:577458810965:web:f0009bfc19ddb845d9e4dc"
};

const firebaseApp = initializeApp(firebaseConfig); // Use initializeApp to create a Firebase app instance

// Configurați axios ca o proprietate globală
aplicatie.config.globalProperties.$axios = axios;


// Crează instanța Vuetify
const vuetify = createVuetify();
aplicatie.use(vuetify);


// window.addEventListener('beforeunload', () => {
//   localStorage.removeItem('token')
//   localStorage.removeItem('userName')
// })

aplicatie.mount('#app');
