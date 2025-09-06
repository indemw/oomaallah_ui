import api from "./apiService.ts";

export default class RoomService {


     async   getRooms(){
    let response;
    try {
      response = await api.get("rooms");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }


  async   getActiveRooms(){
    let response;
    try {
      response = await api.get("getActiveRooms");
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 
  }
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

 async saveRoom(data){

   try {
      response = await api.post("saveRoom",data);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 


}

async updateRoom(data){

   try {
      response = await api.post("updateRoom",data);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 


}

 async deleteRoom(id){

 	 try {
      response = await api.delete("deleteRoom/"+id);
      console.log(response.data)
    } catch (err) {
      return { statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) };
    }
   return response.data; 


}

}