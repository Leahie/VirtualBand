import axios from "axios";

// Define types for better type safety
interface BandData {
  id?: string;
  name: string;
  genre?: string;
  // Add other band properties as needed
}

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
  timeout: 5000,
});

export const getBands = () => api.get("/");
export const getBandById = (id: string) => api.get(`/id/${id}`);
export const createBand = (bandData: BandData) => api.post("/add", bandData);
export const editBand = (bandData: BandData) => api.put("/edit", bandData); 
export const deleteBand = (id: string) => api.delete(`/delete/${id}`); 