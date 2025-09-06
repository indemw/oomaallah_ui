import api from "./apiService.ts";

export default class DashboardService {


 async Index() {
    let response;
    try {
      response = await api.get("index");
      //console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }


 async getTodaysOrders() {
    let response;
    try {
      response = await api.get("getTodaysOrders");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }

  


   async getRooms() {
    let response;
    try {
      response = await api.get("getRooms");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }

  

   async activeReservations() {
    let response;
    try {
      response = await api.get("activeReservations");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
 


   async  pendingOrders() {
    let response;
    try {
      response = await api.get("pendingOrders");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
}