<template>
  <v-app id="postdetails">
    <v-content>
      <v-container>
          <v-row>
          <v-col cols="12">
            <v-card class="card-container">
              <v-card-title id="title" class="text-center post-title">{{ review.title }}</v-card-title>
              <v-card-subtitle id="subtitle" class="ml-4 post-subtitle card-subtitle">
                <v-card-text id="author">Author of book: {{ review.authorOfBook}}</v-card-text>
                <v-card-text id="genre"> Genre: {{ review.genre }}</v-card-text>
                <v-card-text id="user">Review added by: {{ review.author }}</v-card-text>
              </v-card-subtitle>
              <v-card-text class="mt-4 card-text">
                <div id="story" class="italic"> {{review.review}},{{ review.description }}</div>
                <div id="date" class="text-right">{{ formatDate(review.date) }}</div>
              </v-card-text>
              <v-divider></v-divider>
              <div v-if="comments.length === 0" class="my-4">No comments added yet.</div>
              <v-list>
                <v-list-item-group>
                  <v-list-item class="comment-container" v-for="comment in displayedComments" :key="comment.id">
                    <template v-slot:default="{ active }">
                      <v-list-item-content >
                        <v-list-item-title class="font-weight-bold comment-username">{{ comment.userName }}</v-list-item-title>
                        <v-list-item-subtitle class="comment-text">{{ comment.comment }}</v-list-item-subtitle>
                        <v-divider v-if="!active"></v-divider>
                        <v-list-item-action class="comment-actions">
                          <v-btn rounded="xl" v-if="isUserTheAuthor(comment)" class="edit-button" @click="editComment(comment)">
                            <v-icon right>mdi-square-edit-outline</v-icon>
                          </v-btn>
                          <v-btn rounded="xl" v-if="isUserTheAuthor(comment)" class="delete-button" @click="deleteComment(comment.id)">
                            <v-icon right>mdi-trash-can</v-icon>
                          </v-btn>
                        </v-list-item-action>
                      </v-list-item-content>
                    </template>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
              <v-row v-if="isUserAuthenticated">
                <v-col cols="12" class="mt-4">
                  <v-text-field v-model="newComment" label="Add a comment"></v-text-field>
                </v-col>
                <v-col cols="12" class="text-right">
                  <v-btn class="post-button" @click="postComment">
                    <v-icon>{{editing ? 'mdi-arrow-up-bold-outline' : 'mdi-checkbox-marked-outline'}}</v-icon>
                    {{editing ? 'Save changes':'Post comment'}}</v-btn>
                </v-col>
              </v-row>
              <v-row>
                <v-col class="text-center" cols="12">
                  <v-pagination v-model="currentPage" :length="numberOfPages" @input="changePage"></v-pagination>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import axios from 'axios';
import Review from '@/components/Review.vue';
import {
  VApp,
  VContent,
  VContainer,
  VRow,
  VCol,
  VCard,
  VDivider,
  VDialog,
  VPagination,
  VCardSubtitle,
  VCardText,
  VListItem,
  VForm,
  VTextField,
  VTextArea,
  VListItemAction,
  VSnackbar,
  VCardTitle,
  VBtn,
  VWindow,
  VWindowItem,
  VIcon,  
  VProgressLinear,
} from 'vuetify/lib/components';

export default {
  components: {
    Review,
    VIcon,
    VApp,
    VPagination,
    VCardSubtitle,
    VSnackbar,
    VContent,
    VTextArea,
    VDivider,
    VListItem,
    VDialog,
    VProgressLinear,  
    VCardTitle,
    VContainer,
    VRow,
    VListItemAction,
    VCol,
    VCard,
    VCardText,
    VForm,
    VTextField,
    VBtn,
    VWindow,
    VWindowItem,
    
  },
  props: ['review'],
  data() {
    return {
      comments: [],
      itemsPerPage: 5,
      currentPage: 1,
      comment:{},
      newComment:"",
      editing:false,
    };
  },
  computed: {
    isUserAuthenticated() {
      return !!localStorage.getItem('token')
    },
    isUserTheAuthor() {
      return (comment) => {
        const userName = localStorage.getItem('userName')
        return comment.userName === userName
      }
    },
    numberOfPages() {
      return Math.ceil(this.comments.length / this.itemsPerPage)
    },
    displayedComments() {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage
      const endIndex = startIndex + this.itemsPerPage
      return this.comments.slice(startIndex, endIndex)
    },
  },
  mounted() {
    this.getComments()
  },
  methods: {
    async getComments() {
      try {
        const response = await axios.get(`http://localhost:3001/review/${this.review.id}/comments`, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        this.comments = response.data
       
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    },

    async postComment() {
      try {
        this.comment.comment=this.newComment
        this.comment.userName=localStorage.getItem('userName')

        if(this.editing){
          await axios.put(`http://localhost:3001/review/${this.review.id}/comments/${this.comment.id}`,this.comment, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        
        const editedIndex = this.comments.findIndex(c => c.id === this.comment.id)
        if (editedIndex !== -1) {
          this.comments[editedIndex].comment = this.newComment
        }
        
        this.editing = false

        }else{

          const response = await axios.post(`http://localhost:3001/review/${this.review.id}/comments`, this.comment, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
          console.log('Comment sent successfully', response.data)
          
          this.comments.unshift(response.data)
          console.log(this.comments)
        }

        this.newComment = ''
      } catch (error) {
        console.error('Error adding comment:', error)
      }
    },

    editComment(comment){
      this.newComment=comment.comment
      this.comment.id=comment.id
      this.editing=true
    },

    async deleteComment(commentId){
      try {
        await axios.delete(`http://localhost:3001/review/${this.review.id}/comments/${commentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        this.comments = this.comments.filter(comment => comment.id !== commentId)
      } catch (error) {
        console.error('Error deleting comment:', error)
      }
    },
    formatDate(timestamp) {
      // const seconds = timestamp._seconds || 0
      // const nanoseconds = timestamp._nanoseconds || 0
      const date = new Date()

      const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
      return date.toLocaleDateString('en-US', options)
    },
    changePage(page) {
      this.currentPage = page
    },
  },
};
</script>
<style scoped>

  #postdetails {
    height: 100vh; 
    background: linear-gradient(white, #673AB7);
  }

  #title {
    font-family: 'Times New Roman', cursive;
    font-size: 3em;
    color: black;
    font-weight: bold;
    text-shadow: 0 2px 3px white;
  }

  #subtitle {
    margin-top: 1.5em;
    background-color: #673AB7;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 1.5em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    max-width: fit-content;
  }

  #user {
    font-family: 'Times New Roman', cursive;
    color: white;
    font-size: 1.5em;
    margin-bottom: 10px;
    margin-top: 25px;
    text-shadow: 0 2px 3px white;
  }

  #author {
    font-family: 'Times New Roman', cursive;
    font-style: italic;
    color: white;
    font-size: 1.5em;
    text-shadow: 0 2px 3px white;
  }

  #story {
    color: white;
    font-size: 1.5em;
    font-family: 'Dancing Script', cursive;
    background-color: #673AB7;
    padding: 2em;
    border-radius: 8px;
    margin-bottom: 1.5em;
    margin-top: 1.5em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    line-height: 1.8;
    letter-spacing: 2px;
  }

  #date {
    font-family: 'Times New Roman', sans-serif;
    color: black;
    font-size: 1.3em;
  }

  .card-container {
    background: linear-gradient(white, #673AB7);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }

  .comment-container {
    background-color: #673AB7;
    margin-left: 2em;
    margin-right: 2em;
    margin-bottom: 2em;
    margin-top: 2em;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
  }

  .comment-container:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .comment-username {
    font-size: 16px;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    color: black;
  }

  .comment-text {
    font-size: 14px;
    margin-top: 5px;
    font-family: 'Times New Roman', Times, serif;
    color: white;
  }

  .comment-actions {
    margin-top: 10px;
  }

  .post-button, .edit-button, .delete-button {
    margin-right: 10px;
    background-color: #673AB7;
    color: #fff;
    transition: background-color 0.3s, color 0.3s;
    font-family: 'Times New Roman', Times, serif;
  }

  .post-button:hover, .edit-button:hover, .delete-button:hover {
    background-color: #673AB7;
    color: #333;
  }
</style>
