import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
  timeout: 5000,
});

export const getBands = () => api.get("/");
export const getBandById = (id: String) => api.get(`/id/${id}`);
export const createBand = (bandData : any) => api.post("/add", bandData);
export const editBand = (bandData: any) => api.post("/edit", bandData);
export const deleteBand = (id: String) => api.delete(`/delete/{id}`);