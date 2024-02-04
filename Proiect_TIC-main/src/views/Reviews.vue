<template>
  <v-app id="reviewlist">
    <v-content>

    <v-container>
    <v-row class="d-flex justify-center mb-4">
      <v-col>
        <h1 class="display-2 text-center"></h1>
        <h3 class="text-center">Book Reviews</h3>
      </v-col>
    </v-row>

    <Review ref="reviewform" @review-created="addNewReviewToList" @review-edited="updateReview" :dialog-active.sync="isEditDialogActive"/>

    <v-row class="d-flex justify-end" >
    <v-col cols="2">
      <v-select
        v-model="selectedGenre"
        :items="uniqueGenre"
        label="Filter by"
        @change="filterByGenre"
      ></v-select>
    </v-col>
    <v-col cols="2">
      <v-select
        v-model="sortBy"
        :items="sortOptions"
        label="Sort by"
      ></v-select>
    </v-col>
    <!-- <v-col cols="auto">
      <v-btn rounded="xl" size="x-large" @click="toggleSortDirection">
        <v-icon>{{ sortDesc ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
      </v-btn>
    </v-col> -->
  </v-row>

  <v-container style="height: 400px;" v-if="loading">
    <v-row
      class="fill-height"
      align-content="center"
      justify="center">
      <v-col
        class="text-subtitle-1 text-center loading"
        cols="12">Loading reviews</v-col>
      <v-col cols="6">
        <v-progress-linear
          color="white"
          :model-value="loadingProgress"
          rounded
          height="6"></v-progress-linear>
      </v-col>
    </v-row>
  </v-container>

    <v-row class="post-container">
      <v-col v-for="review in filteredReviews" :key="review.id" cols="12" md="6" lg="4">
        <v-card class="post-card">
          <router-link :to="{ name: 'ReviewDetails', params: { reviewTitle: review.title }, query: { review: JSON.stringify(review) } }">
            <v-card-title>{{ review.title }}</v-card-title>
          </router-link>
          <v-card-subtitle >{{ review.authorOfBook}}, {{ review.genre}}</v-card-subtitle>
          <v-col md="10" id="author" class="text-right" @click="filterByGenre(review.genre)">
            Review added by: {{ review.author }}
          </v-col>
          <v-card-text class="card-content">{{ review.review }}</v-card-text>
          <v-card-text class="card-content">{{ review.description }}</v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn rounded="xl" v-if="isCurrentUserAuthor(review)" @click="openEditDialog(review)">
              <v-icon right>mdi-square-edit-outline </v-icon></v-btn>

            <v-btn rounded="xl" v-if="isCurrentUserAuthor(review)" @click="deleteReview(review.id)">
              <v-icon right>mdi-trash-can</v-icon></v-btn>

            <v-btn :class="{ 'red--text': review.likes }" v-if="!isCurrentUserAuthor(review)" icon @click="likeReview(review.id)">
              <v-icon :color="review.liked ? 'red' : ''">{{ review.likes ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              <span class="ml-1">{{ review.likes }}</span>
            </v-btn>
          </v-card-actions>

        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="showLoginNotification" timeout="3000" color="red">
      Login before you interact with a review!
    </v-snackbar>

    <v-dialog v-model="showDeleteConfirmation" max-width="400">
    <v-card>
      <v-card-title class="headline">
        Confirm delete
      </v-card-title>
      <v-card-text>
        Are you sure you want to delete the review "{{ reviewToDelete ? reviewToDelete.title : '' }}"?
      </v-card-text>
      <v-card-actions>
        <v-btn @click="cancelDelete">Cancel</v-btn>
        <v-btn color="error" @click="confirmDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-row>
      <v-col class="text-center" cols="12">
        <v-pagination
          v-model="currentPage"
          :length="numberOfPages"
          @input="changePage"
        ></v-pagination>
      </v-col>
    </v-row>
  </v-container>

  </v-content>
  </v-app>
</template>

<script>
import axios from 'axios'
//import { globalRequestParams, baseURL } from './Utils/requests.js'
//const { globalRequestParams, baseURL } = require('../Utils/requests.js')
import Review from '@/components/Review.vue'
import {
  VApp,
  VContent,
  VContainer,
  VSelect,
  VRow,
  VCol,
  VCard,
  VDialog,
  VPagination,
  VCardText,
  VCardActions,
  VForm,
  VTextField,
  VSnackbar,
  VCardTitle,
  VBtn,
  VWindow,
  VTextArea,
  VWindowItem,
  VIcon,  
  VProgressLinear,  
} from 'vuetify/lib/components';

export default {
  components: {
    Review,
    VIcon,
    VApp,
    VSelect,
    VCardActions,
    VPagination,
    VSnackbar,
    VContent,
    VTextArea,
    VDialog,
    VProgressLinear,  // Add this line
    VCardTitle,
    VContainer,
    VRow,
    VCol,
    VCard,
    VCardText,
    VForm,
    VTextField,
    VBtn,
    VWindow,
    VWindowItem
  },
data() {
  return {
    reviews: [],
    loading: true,
    loadingProgress: 0,
    itemsPerPage: 6,
    currentPage: 1,
    selectedTitle: null,
    selectedGenre: null,
    sortBy: "", 
    sortDesc: false,
    sortOptions: ['likes'], 
    showLoginNotification: false,
    showDeleteConfirmation: false,
    reviewToDelete: null,
    isEditDialogActive: false,
  }
},
computed: { 
  isCurrentUserAuthor() {
      return (review) => {
        const userName = localStorage.getItem('userName'); 
        return review.author === userName;
      };
  },
  numberOfPages() {
    return Math.ceil(this.reviews.length / this.itemsPerPage)
  },

  displayedReviews() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    return this.reviews.slice(startIndex, endIndex)
  },
  uniqueGenre() {
  const allGenres = this.reviews.map(review => review.genre)
  const uniqueGenre = [...new Set(allGenres)] // no duplicates
  return ['All genres', ...uniqueGenre]
},
filteredReviews() {
  if (this.selectedGenre) {
      return this.reviews.filter((review) => review.genre === this.selectedGenre)
  }

  const sortedReviews = [...this.reviews]

  sortedReviews.sort((a, b) => {
     if (this.sortBy === 'likes') {
      return this.sortDesc ? b.likes - a.likes : a.likes - b.likes
    }
    return 0
  })

  return this.selectedGenre && this.selectedGenre !== 'All genres'
    ? sortedReviews.filter(review => review.genre === this.selectedGenre)
    : sortedReviews.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage)
},

},
mounted() {
  window.addEventListener('popstate', this.handlePopstate) // triggered: forward/back - change browser history state

  this.startLoadingProgress()
  this.getAllReviews()
},
methods: {
  handlePopstate(event) {
    // AI NEVOIE DE PREVIOUS STATE SAU DIRECT RESET?
    if (event.state) {
      this.selectedAuthor = event.state.selectedAuthor || null // no author selected 
      this.currentPage = event.state.currentPage || 1 // back 
      //this.filterReviewsByAuthor()
    }
  },
  filterByGenre(genre) {
    this.selectedGenre = genre
    this.currentPage = 1

    const currentState = {
      selectedGenre: this.selectedGenre,
      currentPage: this.currentPage,
    } // save current state to get back to it
    window.history.pushState(currentState, null, null) // state, pageName, URL (same as before)
  },
  startLoadingProgress() {
    this.loadingInterval = setInterval(() => {
      if (this.loadingProgress === 100) {
        this.stopLoadingProgress()
      } else {
        this.loadingProgress += 10
      }
    }, 350)
  },
  stopLoadingProgress() {
    clearInterval(this.loadingInterval)
    this.loadingProgress = 100
    this.loading = false
  },

  async getAllReviews() {
      try {
        const response = await axios.get('http://localhost:3001/reviews');
        this.reviews = response.data; // Modificare aici pentru a salva în this.reviews
        this.stopLoadingProgress();
        console.log(response);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
  },

  openEditDialog(review) {
    this.$refs.reviewform.openEditForm(review)
    this.isEditDialogActive = true
  },

  async likeReview(reviewId) {
  try {
    const token = localStorage.getItem('token')
    const userName = localStorage.getItem('userName')
    
    if (!token) {
      console.error('User is not authenticated. Unable to like review.') 
      this.showLoginNotification = true
      setTimeout(() => {
        this.showLoginNotification = false
      }, 3000)
      return
    }
    console.log(token, userName)

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    const response = await axios.put(`http://localhost:3001/review/${reviewId}/like`, null, config)

    const reviewIndex = this.reviews.findIndex(review => review.id === reviewId)
    if (reviewIndex !== -1) {
      this.reviews[reviewIndex].likes++
      this.reviews[reviewIndex].liked=true
    }
  } catch (error) {
    console.error('Error liking review:', error)
  }
},

async deleteReview(reviewId) {
  this.reviewToDelete = this.reviews.find(review => review.id === reviewId)
  this.showDeleteConfirmation = true
},
cancelDelete() {
  this.showDeleteConfirmation = false
  this.reviewToDelete = null
},
async confirmDelete() {
  this.showDeleteConfirmation = false
  const reviewId = this.reviewToDelete.id
    try {
      const token = localStorage.getItem('token')
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      await axios.delete(`http://localhost:3001/review/${reviewId}`, config)

      this.reviews = this.reviews.filter(review => review.id !== this.reviewToDelete.id);
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  },

  addNewReviewToList(newReview) {
    this.reviews.unshift(newReview)
  },
  updateReview(updatedReview) {
    const index = this.reviews.findIndex(review => review.id === updatedReview.id)
    if (index !== -1) {
      this.reviews[index] = updatedReview
    }
  },

  changePage(page) {
    this.currentPage = page
  },
  filterByTitle() {
    if (this.selectedTitle && this.selectedTitle !== 'Toate recenziile') {
    this.currentPage = 1 // reset page number after applying filter
    }
  },
  toggleSortDirection() {
    this.sortDesc = !this.sortDesc
  },
  // extractSummary(review) {
  //     const sentences = review.split(/[.!?;]/)
  //     const firstTwoSentences = sentences.slice(0, 2).join('.') +"..." 
  //     return firstTwoSentences
  //   },
    extractDateFromTimestamp(timestamp) {
      console.log("aici")
      const seconds = timestamp._seconds || 0;
      const nanoseconds = timestamp._nanoseconds || 0;
      return new Date(seconds * 1000 + nanoseconds / 1000000)
    },
},
}
</script>
<style scoped>
#reviewlist {
  height: 100vh; 
  background: linear-gradient(white, #673AB7);
}

h1 {
  font-family: 'Times New Roman', cursive;
  font-size: 3em;
  color: black;
  text-shadow: 0 2px 3px white;
}

h3 {
  font-family: 'Times New Roman', sans-serif;
  font-size: 2em;
  color: black;
  text-shadow: 0 2px 3px white;
}

.loading {
  font-family: 'Times New Roman', sans-serif;
  font-size: 2.2em;
  color: white;
}

.sort-controls v-icon {
  font-size: 24px;
}

.post-card {
  min-height: 20em;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  background-color: #fff; 
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 30px;
  transition: background-color 0.3s, transform 0.3s;
}

.post-card:hover {
  background-color: #f8f8f8;
  transform: scale(1.02);
}

#author {
  font-family: 'Times New Roman', cursive;
  font-weight: bold;
  font-size: 20px; 
}

.card-content {
  flex-grow: 1;
  overflow: hidden;
  color: #333;
}

.post-card a {
  color: rgb(134, 42, 42);
  font-family: 'Quicksand', sans-serif;
}

.post-card a:hover {
  color: black;
}

.v-select {
  height: 1em;
  max-width: 10em;
  /* background-color: black;  */
  color: black; 
  border: none;
  margin: 20px;
  margin-top: 10px; /* Adăugată această linie pentru a ajusta poziția în sus */
  transition: background-color 0.3s;
}


/* .v-select:hover,
.v-select:focus {
  background-color: black;
} */

.v-select-item:hover {
  background-color: #6e3a8f;
  color: #fff;
}

.v-btn {
  background-color: #8e57b5; /* Schimbați culoarea pentru butoane */
  color: #fff;
  border: none;
  margin: 2px;
  transition: background-color 0.3s;
}

.v-btn:hover {
  background-color: #6e3a8f;
}

.sort-controls v-icon {
  font-size: 24px;
}

.v-progress-linear {
  background-color: #8e57b5; /* Schimbați culoarea pentru bara de încărcare */
  color: #fff;
}
</style>
