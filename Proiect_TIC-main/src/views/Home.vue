<template>
    <div class="carousel">
      <h2><b>Popular books</b></h2>
      <v-carousel>
        <v-carousel-item v-for="book in books" :key="book.id">
          <v-slide>
            <v-card class="card">
              <v-img :src="'/images/' + book.image" :alt="book.title" />
              <v-card-title>{{ book.title }}</v-card-title>
              <v-card-subtitle>{{ book.author }}</v-card-subtitle>
              <v-card-text>{{ book.description }}</v-card-text>
            </v-card>
          </v-slide>
        </v-carousel-item>
      </v-carousel>
    </div>
  </template>
  
  <script>
  import { VApp, VContainer, VCarousel, VCarouselItem, VCard, VImg, VCardTitle, VCardSubtitle, VCardText, VSlide } from 'vuetify/lib/components';
  
  export default {
    components: {
      VApp,
      VContainer,
      VCarousel,
      VCarouselItem,
      VCard,
      VImg,
      VCardTitle,
      VCardSubtitle,
      VCardText,
      VSlide,
    },
    data() {
      return {
        books: [
          {
            id: 1,
            title: 'Things that we never got over',
            author: 'Lucy Score',
            image: 'carte1.png'
          },
          {
            id: 2,
            title: 'Twisted hate - Inamici cu beneficii',
            author: 'Ana Huang',
            image: 'carte2.png'
          },
          {
            id: 3,
            title: 'House of flame and shadow',
            author: 'Sarah J, Maas',
            image: 'carte3.png'
          },
          
        ],
      };
    },
  };
  </script>

<style scoped>
.carousel {
  width: 80%;
  margin: auto;
  text-align: center;
}

.card {
  width: 20%;
  max-height: 40;
  border: 1px solid #ddd; 
  border-radius: 5px;  
  display: inline-block;
  flex-direction: column;
}

.v-carousel-item {
  text-align: center;
}

 .v-card-text {
  margin: 0;
} 
</style>
