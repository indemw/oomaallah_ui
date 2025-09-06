import api from "./apiService.ts";
import axios from "axios";
export default class ReservationService {




 async getAppSetting() {
    let response;
    try {
      response = await api.get("appsetting");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }

 async getReservations() {
    let response;
    try {
      response = await api.get("getReservations");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }

async  getAllocatedReservations() {
    let response;
    try {
      response = await api.get("getAllocatedReservations");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
   async  deleteReservation(id){
    let response;
    try {
      response = await api.delete("deleteReservation/"+id);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
//room types

 

     async   getRoomTypes(){
    let response;
    try {
      response = await api.get("getRoomTypes");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }

  async   createRoomType(payload){
    let response;
    try {
      response = await api.post("saveRoomType",payload);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
  
    async   updateRoomType(payload){
    let response;
    try {
      response = await api.post("updateRoomType",payload);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
   async   uploadImage(payload){
    let response;
    try {
      response =
await axios.post('http://localhost/oomaallah_api/api/uploadImage', payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
             // Include if using authentication
          },
        });
       //await api.post("saveRoomType",payload);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
 async   deleteRoomType(id){
    let response;
    try {
      response = await api.delete("deleteRoomType/"+id);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }

  

  async  getMonthlyReservation(data) {

    let response;
    try {
      response = await api.get("getMonthlyReservation",data);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }

  async getRoomsCount(){

     let response;
    try {
      response = await api.get("getRoomsCount");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 


  }

  

  async   updateReservation(payload){
    let response;
    try {
      response = await api.post("updateReservation",payload);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
}