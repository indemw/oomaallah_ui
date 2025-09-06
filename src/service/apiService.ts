import axios from "axios";
//import router from "../router";
// import { attemptLogout } from "../pages/auth/auth.services";


 
 //export const baseURL = "http://localhost/indemenu/api/v1/";//local

 export const baseURL = "http://localhost/oomaallah_api/api/";//local

 //export const baseURL = "https://indicate.indemw.tech/api/";//remote
const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  }
});
api.interceptors.response.use(null, error => {
  if (error.response && error.response.status === 401) {
    if (error.response.data) {
      if (error.response.data.message === "Unauthenticated.") {
        // attemptLogout().then(() => router.push("/auth/login")).catch(() => {
        // }
        // );
      }
    }
  }
  // @ts-ignore
  return Promise.reject(error);
});

// @ts-ignore
api.interceptors.request.use(
  config => {
    const auth_token = localStorage.getItem("access_token");
    if (auth_token) config.headers["Authorization"] = `Bearer ${auth_token}`;
    return config;
  },
// @ts-ignore
  error => Promise.reject(error)
);
export default api;
