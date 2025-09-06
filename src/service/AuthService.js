import api from "./apiService.ts";
export default class AuthService {


 async testApi() {
    let response;
    try {
      response = await api.get("test");
      console.log(response.data.version)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }

  async authenticate(data) {
    let response;
    try {
      response = await api.post("login", data);
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return response.data
  }

   async register(data) {
    let response;
    try {
      response = await api.post("register", data);
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }
  async requestPasswordLink(data) {
    let response;
    try {
      response = await api.post("password-request-link", data);
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }
 
  async changePassword(data) {
    let response;
    
    try {
      response = await api.post("password-change", data);
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }
  async getCurrentUser() {
    let response;
    try {
      response = await api.get("me");
    } catch (err) {
      return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }

  async logout() {
    let response;
    try {
      response = await api.post("logout");
    } catch (err) {
      return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }

 

    async  getSession(data) {
    let response;
    try {
      response = await api.get("session");
    } catch (err) {
      return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
    }
    return { statusCode: 200, body: response.data };
  }

  

   async getTotalUsers() {
    let response;
    try {
      response = await api.get("userCount");
      
      //console.log(response.data.version)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return response.data; 
}


   async getUserRole(id) {
    let response;
    try {
      response = await api.get("userRole/"+id);
      
      //console.log(response.data.version)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return response.data; 
}


 async assignAdmin(data) {
    let response;
    try {
      response = await api.post("assignAdmin", data);
      
      //console.log(response.data.version)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return response.data; 
}

systemCheck

 async systemCheck(){
    let response;
    try {
      response = await api.get("test");
      
      //console.log(response.data.version)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
    return response.data; 
}
}
