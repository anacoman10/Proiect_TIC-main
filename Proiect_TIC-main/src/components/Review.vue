<template>
  <v-dialog min-height="30em" width="25em" v-model="isActive" transition="dialog-bottom-transition" scrollable>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" v-if="isUserAuthenticated" rounded="xl" size="x-large">
        <v-icon right></v-icon>Add a review
      </v-btn>
    </template>
    <template v-slot:default>
      <v-card>
        <v-card-title class="text-center purple-text">Write a review</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field v-model="review.title" label="Title" :rules="titleRules" />
            <v-text-field v-model="review.authorOfBook" label="Author of book" :rules="authorRules" />
            <v-text-field v-model="review.genre" label="Genre" :rules="genreRules" />
            <v-text-field v-model="review.review" label="Describe your review about book" :rules="reviewRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn id="submit" @click="submit">Publish</v-btn>
          <v-btn id="close" @click="isActive = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
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
VDialog,
VPagination,
VCardText,
VForm,
VTextField,
VSnackbar,
VCardTitle,
VBtn,
VWindow,
VTextArea,
VWindowItem
} from 'vuetify/lib/components';

export default {
components: {
  VApp,
  VPagination,
  VSnackbar,
  VContent,
  VTextArea,
  VDialog,
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
    review: {
      title: '',
      authorOfBook: '',
      genre: '',
      review: '',
      likes:'',
      author:'',
    },
    valid:false,
    isActive: false,
    isEditing: false,
  };
},
computed: {
  isUserAuthenticated() {
    return !!localStorage.getItem('token')
  },
  titleRules() {
    return [
      (v) => !!v || 'Title is required',
      (v) => (v && v.length >= 5) || 'Title must be at least 5 characters',
    ]
  },
  authorRules() {
    return [
      (v) => !!v || 'Author is required',
      (v) => /^[a-zA-Z\s]*$/.test(v) || 'Author must contain only letters and spaces',
    ]
  },
  genreRules() {
    return [
      (v) => !!v || 'Genre is required',
      (v) => /^[a-zA-Z\s]*$/.test(v) || 'Genre must contain only letters and spaces',
    ]
  },
  reviewRules() {
    return [
      (v) => !!v || 'Description of a review is required',
      (v) => {
          const sentences = v.split(/[.!?;]/)
          return (sentences.length >= 3) || 'Description must contain at least 3 sentences'
      },
    ]
  },
},
  mounted() {},
  methods: {
    openEditForm(review) {
      this.review = { ...review }
      this.isActive = true
      this.isEditing = true
    },
    async submit() {
      try {
        await this.$refs.form.validate()
        if (this.valid) {
          if(this.isEditing){
            const response = await axios.put(`http://localhost:3001/review/${this.review.id}`, this.review, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
            console.log('Review edited successfully', response.data)

            this.$emit('review-edited', this.review)
            console.log(this.review)

          }else{
            this.review.likes=0
            this.review.author=localStorage.getItem('userName')
            this.review.date=this.generateCustomTimestamp()
            console.log(this.review.date)

            const response = await axios.post('http://localhost:3001/review', this.review, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
            console.log('Review sent successfully', response.data)
            
            const reviewId = response.data._path.segments[1]
            this.review.id=reviewId

            this.$emit('review-created', this.review)
            console.log(this.review)
          }
        
          this.review = {
            title: '',
            authorOfBook: '',
            genre: '',
            review: '',
            author:'',
          }

          this.isActive = false
        }
      } catch (error) {
        console.error('Error sending review', error)
      }
    },
    isValidString(value) {
        const regex = /^[A-Za-z]+$/
        return regex.test(value)
    },
    generateCustomTimestamp() {
      const customDate = new Date()
      const seconds = Math.floor(customDate.getTime() / 1000)
      const nanoseconds = customDate.getMilliseconds() * 1000000
      return {
        _seconds: seconds,
        _nanoseconds: nanoseconds,
      }
  },
},
}
</script>
<style scoped>
  .purple-background {
    background-color: #7453a1; 
    color: black; 
  }

  .purple-text {
    font-family: 'Times New Roman', cursive;
    font-size: 1.75em;
  }

  .v-form {
    padding: 16px;
    background-color: #ffffff; 
  }

  .v-text-field,
  .v-textarea {
    margin-bottom: 16px;
  }

  .author {
    margin-left: 0.2em;
    margin-right: 0.2em;
  }

  .v-text-field {
    margin-inline-start: 0.5em;
  }

  .v-btn {
    background-color: #7453a1;
    color: #e3d3f7;
  }

  #submit {
    color: white;
    margin: 75px;
  }

  #close {
    color: white;
  }

  .v-btn:hover {
    background-color: #574177;
  }

  .v-btn mdi-draw {
    margin-right: 8px;
  }

  .v-btn mdi-draw,
  .v-btn mdi-draw:hover {
    color: #e3d3f7;
  }
</style>
