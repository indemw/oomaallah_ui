import api from "@/service/apiService.ts";
export default class AuthService {


 async getRestaurants() {
    let response;
    try {
      response = await api.get("vendor");
    
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }

  

   async getCuisines() {
    let response;
    try {
      response = await api.get("cuisine");
     
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }

 


   async  getMenus(id) {
    let response;
    try {
    
        response = await api.get("VendorMenu/"+id)
     
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }
}
